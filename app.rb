# app.rb
require 'sinatra'
require 'json'
require_relative 'lib/blockchain'
require_relative 'lib/wallet'
require_relative 'lib/transaction'
require_relative 'lib/storage'

# Single-instance node (for simplicity). In production you'd run multiple nodes.
BLOCKCHAIN = Blockchain.new

set :port, (ENV['PORT'] || 4567)
set :bind, '0.0.0.0'

before do
  content_type 'application/json'
end

get '/' do
  { message: "Ruby Blockchain Node", chain_length: BLOCKCHAIN.chain.length }.to_json
end

# get chain
get '/chain' do
  { chain: BLOCKCHAIN.chain.map(&:to_h), length: BLOCKCHAIN.chain.length }.to_json
end

# create wallet (returns keypair)
post '/wallet/new' do
  wallet = Wallet.new
  { address: wallet.address, private_key: wallet.private_pem }.to_json
end

# create transaction (expects sender_pub_pem, private_key_pem, recipient, amount)
post '/transactions/new' do
  payload = JSON.parse(request.body.read)
  tx = Transaction.new(sender: payload['sender'], recipient: payload['recipient'], amount: payload['amount'])
  tx.sign!(payload['private_key'])
  if tx.valid?
    BLOCKCHAIN.create_transaction(tx)
    status 201
    { message: "Transaction added", tx_id: tx.id }.to_json
  else
    status 422
    { message: "Invalid transaction" }.to_json
  end
end

# mine pending transactions
post '/mine' do
  payload = JSON.parse(request.body.read || "{}")
  miner_address = payload['miner_address'] || 'anonymous'
  block = BLOCKCHAIN.mine_pending_transactions(miner_address)
  { message: "Block mined", block: block.to_h }.to_json
end

get '/balance' do
  addr = params['address']
  halt 400, { message: "address required" }.to_json unless addr
  { address: addr, balance: BLOCKCHAIN.get_balance(addr) }.to_json
end

post '/validate' do
  { valid: BLOCKCHAIN.is_chain_valid? }.to_json
end
