# lib/block.rb
require_relative 'util'

class Block
  attr_accessor :index, :timestamp, :transactions, :prev_hash, :nonce, :hash

  def initialize(index:, transactions:, prev_hash:)
    @index = index
    @timestamp = Util.current_time_iso
    @transactions = transactions # array of transaction hashes
    @prev_hash = prev_hash
    @nonce = 0
    @hash = compute_hash
  end

  def to_h
    {
      index: @index,
      timestamp: @timestamp,
      transactions: @transactions,
      prev_hash: @prev_hash,
      nonce: @nonce,
      hash: @hash
    }
  end

  def compute_hash
    Util.sha256([@index, @timestamp, Util.serialize(@transactions), @prev_hash, @nonce].join)
  end

  def mine!(difficulty)
    target = '0' * difficulty
    until compute_hash.start_with?(target)
      @nonce += 1
    end
    @hash = compute_hash
    self
  end
end
