<?php
// danail_server.php
use Swoole\Http\Server;
use Swoole\Coroutine;
use Swoole\Coroutine\Redis;

require __DIR__ . '/vendor/autoload.php';

$server = new Server("0.0.0.0", 9501, SWOOLE_PROCESS, SWOOLE_SOCK_TCP);

$server->set([
    'worker_num' => 4,            // tune per CPU
    'max_request' => 10000,       // recycle workers
    'dispatch_mode' => 2,
    'enable_coroutine' => true,
    'log_level' => SWOOLE_LOG_INFO,
]);

// Simple DI-ish container
$container = [
    'redis' => function() {
        $r = new Redis();
        $r->connect('redis', 6379, 1.0);
        return $r;
    }
];

// Simple route handling
$server->on('request', function($req, $res) use ($container) {
    try {
        // Basic CORS & headers
        $res->header("Content-Type", "application/json; charset=utf-8");
        $res->header("Access-Control-Allow-Origin", "*");

        $path = $req->server['request_uri'];
        $method = $req->server['request_method'];

        // Simple rate-limiting per IP (Redis INCR with TTL)
        $ip = $req->server['remote_addr'] ?? 'unknown';
        $redis = ($container['redis'])();
        $key = "rl:{$ip}:" . date('YmdHi'); // per-minute
        $count = $redis->incr($key);
        if ($count == 1) $redis->expire($key, 65);
        if ($count > 300) { // tune threshold
            $res->status(429);
            $res->end(json_encode(['error' => 'rate_limited']));
            return;
        }

        if ($path === '/v1/health' && $method === 'GET') {
            $res->status(200);
            $res->end(json_encode(['status' => 'ok', 'time' => time()]));
            return;
        }

        if ($path === '/v1/items' && $method === 'GET') {
            // Example: try cache first
            $cacheKey = "items:all";
            $cached = $redis->get($cacheKey);
            if ($cached) {
                $res->status(200);
                $res->end($cached);
                return;
            }

            // Simulate DB fetch with coroutine sleep (replace with actual DB access)
            Coroutine::sleep(0.01);
            $items = [
                ['id' => 1, 'name' => 'Item A'],
                ['id' => 2, 'name' => 'Item B'],
            ];
            $json = json_encode(['items' => $items]);
            $redis->setex($cacheKey, 15, $json); // cache for 15s
            $res->status(200);
            $res->end($json);
            return;
        }

        // fallback 404
        $res->status(404);
        $res->end(json_encode(['error' => 'not_found']));
    } catch (\Throwable $e) {
        $res->status(500);
        $res->end(json_encode(['error' => 'server_error']));
    }
});

$server->start();
