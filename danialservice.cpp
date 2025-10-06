// main.cpp
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio.hpp>
#include <boost/asio/signal_set.hpp>
#include <boost/asio/dispatch.hpp>
#include <boost/asio/strand.hpp>
#include <iostream>
#include <memory>
#include <string>
#include <thread>
#include <vector>
#include <nlohmann/json.hpp> // header-only: https://github.com/nlohmann/json
#include <sw/redis++/redis++.h> // redis-plus-plus

namespace beast = boost::beast;         // from <boost/beast.hpp>
namespace http = beast::http;           // from <boost/beast/http.hpp>
namespace asio = boost::asio;           // from <boost/asio.hpp>
using tcp = asio::ip::tcp;

using json = nlohmann::json;
using namespace sw::redis;

// Simple helper: make JSON response
http::response<http::string_body> make_json_response(int status, const std::string& body) {
    http::response<http::string_body> res{http::status(status), 11};
    res.set(http::field::content_type, "application/json; charset=utf-8");
    res.set(http::field::server, "danail-cpp");
    res.body() = body;
    res.prepare_payload();
    return res;
}

// This function handles an HTTP request and writes a response
template<class Stream>
void handle_request(const http::request<http::string_body>& req, std::shared_ptr<Redis> redis, http::response<http::string_body>& res) {
    try {
        auto method = req.method();
        auto target = std::string(req.target());

        // Very simple rate-limiting per-IP (Redis INCR with TTL)
        std::string ip = req[http::field::via].empty() ? "anon" : std::string(req[http::field::via]);
        // Note: real app should extract X-Forwarded-For from headers set by NGINX

        if (method == http::verb::get && target == "/v1/health") {
            json j;
            j["status"] = "ok";
            j["time"] = (long)time(nullptr);
            res = make_json_response(200, j.dump());
            return;
        }

        if (method == http::verb::get && target == "/v1/items") {
            // cache key
            std::string cacheKey = "items:all";

            // Try Redis GET
            OptionalString cached = redis->get(cacheKey);
            if (cached) {
                res = make_json_response(200, *cached);
                return;
            }

            // Simulate DB fetch (replace with actual DB call)
            json j;
            j["items"] = json::array({
                { {"id", 1}, {"name", "Item A"} },
                { {"id", 2}, {"name", "Item B"} }
            });

            std::string payload = j.dump();

            // Set cache with TTL 15s
            redis->setex(cacheKey, 15, payload);

            res = make_json_response(200, payload);
            return;
        }

        // Not found
        json j; j["error"] = "not_found";
        res = make_json_response(404, j.dump());
    } catch (const Error &e) {
        json j; j["error"] = "server_error";
        res = make_json_response(500, j.dump());
    }
}

//------------------------------------------------------------------------------
// Handles an HTTP server connection
class session : public std::enable_shared_from_this<session> {
    tcp::socket socket_;
    beast::flat_buffer buffer_;
    std::shared_ptr<Redis> redis_;
    http::request<http::string_body> req_;
public:
    explicit session(tcp::socket socket, std::shared_ptr<Redis> r)
        : socket_(std::move(socket)), redis_(r) {}

    void run() { do_read(); }

    void do_read() {
        auto self = shared_from_this();
        http::async_read(socket_, buffer_, req_,
            [self](beast::error_code ec, std::size_t bytes_transferred) {
                boost::ignore_unused(bytes_transferred);
                if (!ec)
                    self->on_read();
            });
    }

    void on_read() {
        http::response<http::string_body> res;
        handle_request<tcp::socket>(req_, redis_, res);

        auto self = shared_from_this();
        http::async_write(socket_, res,
            [self](beast::error_code ec, std::size_t) {
                self->socket_.shutdown(tcp::socket::shutdown_send, ec);
            });
    }
};

//------------------------------------------------------------------------------
// Accepts incoming connections and launches the sessions
class listener : public std::enable_shared_from_this<listener> {
    asio::io_context& ioc_;
    tcp::acceptor acceptor_;
    std::shared_ptr<Redis> redis_;
public:
    listener(asio::io_context& ioc, tcp::endpoint endpoint, std::shared_ptr<Redis> r)
        : ioc_(ioc), acceptor_(ioc) , redis_(r)
    {
        beast::error_code ec;
        acceptor_.open(endpoint.protocol(), ec);
        acceptor_.set_option(asio::socket_base::reuse_address(true), ec);
        acceptor_.bind(endpoint, ec);
        acceptor_.listen(asio::socket_base::max_listen_connections, ec);
    }

    void run() { do_accept(); }

    void do_accept() {
        auto self = shared_from_this();
        acceptor_.async_accept(asio::make_strand(ioc_),
            [self](beast::error_code ec, tcp::socket socket) {
                if (!ec) {
                    std::make_shared<session>(std::move(socket), self->redis_)->run();
                }
                self->do_accept();
            });
    }
};

//------------------------------------------------------------------------------

int main(int argc, char* argv[]) {
    try {
        // config
        int threads = std::max<int>(1, std::thread::hardware_concurrency());
        std::string host = "0.0.0.0";
        unsigned short port = 8080;
        std::string redis_uri = "tcp://127.0.0.1:6379";

        // Create Redis connection (redis-plus-plus)
        ConnectionOptions opts;
        opts.host = "127.0.0.1";
        opts.port = 6379;
        opts.socket_timeout = std::chrono::milliseconds(200);
        auto redis = std::make_shared<Redis>(opts);

        asio::io_context ioc{threads};

        // Capture signals to allow clean shutdown
        asio::signal_set signals(ioc, SIGINT, SIGTERM);
        signals.async_wait([&](auto, auto){
            ioc.stop();
        });

        auto endpoint = tcp::endpoint(asio::ip::make_address(host), port);
        std::make_shared<listener>(ioc, endpoint, redis)->run();

        // Run the io_context in N threads
        std::vector<std::thread> v;
        v.reserve(threads - 1);
        for (int i = 0; i < threads - 1; ++i)
            v.emplace_back([&ioc]{ ioc.run(); });
        ioc.run();

        for (auto &t : v) if (t.joinable()) t.join();
    } catch (const std::exception& e) {
        std::cerr << "Fatal: " << e.what() << "\n";
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
