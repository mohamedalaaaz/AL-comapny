# lib/blockchain.rb
require_relative 'block'
require_relative 'transaction'
require_relative 'storage'
require_relative 'util'

class Blockchain
  attr_reader :chain, :difficulty, :pending_transactions, :mining_reward

  def initialize(difficulty: 3, mining_reward: 50.0)
    @difficulty = difficulty
    @mining_reward = mining_reward
    @chain = []
    @pending_transactions = []
    load_or_create_genesis
  end

  def load_or_create_genesis
    blocks = Storage.all_blocks
    if blocks.empty?
      genesis = Block.new(index: 0, transactions: [], prev_hash: "0")
      genesis.hash = genesis.compute_hash
      @chain << genesis
      Storage.store_block(genesis)
    else
      blocks.each do |b|
        blk = Block.new(index: b['index'], transactions: b['transactions'], prev_hash: b['prev_hash'])
        blk.timestamp = b['timestamp']
        blk.nonce = b['nonce']
        blk.hash = b['hash']
        @chain << blk
      end
    end
    # load pending txs from storage
    Storage.pending_transactions.each do |txh|
      tx = Transaction.new(sender: txh['sender'], recipient: txh['recipient'], amount: txh['amount'])
      tx.signature = txh['signature']
      tx.timestamp = txh['timestamp']
      tx.instance_variable_set(:@id, txh['id'])
      @pending_transactions << tx
    end
  end

  def latest_block
    @chain.last
  end

  def create_transaction(tx)
    raise "Invalid transaction" unless tx.valid?
    @pending_transactions << tx
    Storage.store_transaction(tx)
  end

  def mine_pending_transactions(miner_address)
    # reward transaction
    reward_tx = Transaction.new(sender: 'SYSTEM', recipient: miner_address, amount: @mining_reward)
    @pending_transactions.unshift(reward_tx)

    block = Block.new(index: latest_block.index + 1, transactions: @pending_transactions.map(&:to_h), prev_hash: latest_block.hash)
    block.mine!(@difficulty)
    @chain << block
    Storage.store_block(block)

    # mark txs confirmed
    @pending_transactions.each { |tx| Storage.mark_tx_confirmed(tx.id) }
    @pending_transactions = []
    block
  end

  def is_chain_valid?
    @chain.each_with_index do |b, idx|
      next if idx == 0
      prev = @chain[idx-1]
      return false unless b.hash == b.compute_hash
      return false unless b.prev_hash == prev.hash
      # validate transactions inside block
      b.transactions.each do |txh|
        next if txh['sender'] == 'SYSTEM'
        tx = Transaction.new(sender: txh['sender'], recipient: txh['recipient'], amount: txh['amount'])
        tx.signature = txh['signature']
        tx.timestamp = txh['timestamp']
        tx.instance_variable_set(:@id, txh['id'])
        return false unless tx.valid?
      end
    end
    true
  end

  # helper: get balance
  def get_balance(address)
    balance = 0.0
    @chain.each do |blk|
      blk.transactions.each do |tx|
        if tx['recipient'] == address
          balance += tx['amount'].to_f
        end
        if tx['sender'] == address
          balance -= tx['amount'].to_f
        end
      end
    end
    balance
  end
end
