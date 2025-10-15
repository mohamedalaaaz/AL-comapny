# lib/storage.rb
require 'sequel'
require_relative 'util'

DB = Sequel.sqlite('db/blockchain.db')

# migrations - create tables if not exist
unless DB.table_exists?(:blocks)
  DB.create_table :blocks do
    primary_key :id
    Integer :index
    Text :payload, null: false  # JSON of block
    String :hash
    String :prev_hash
  end
end

unless DB.table_exists?(:transactions)
  DB.create_table :transactions do
    primary_key :id
    String :tx_id
    Text :payload   # JSON of transaction
    TrueClass :confirmed, default: false
  end
end

module Storage
  Blocks = DB[:blocks]
  Transactions = DB[:transactions]

  def self.store_block(block)
    Blocks.insert(index: block.index, payload: Util.serialize(block.to_h), hash: block.hash, prev_hash: block.prev_hash)
  end

  def self.all_blocks
    Blocks.all.map { |r| Util.deserialize(r[:payload]) }
  end

  def self.store_transaction(tx)
    Transactions.insert(tx_id: tx.id, payload: tx.to_json, confirmed: false)
  end

  def self.mark_tx_confirmed(tx_id)
    Transactions.where(tx_id: tx_id).update(confirmed: true)
  end

  def self.pending_transactions
    Transactions.where(confirmed: false).all.map { |r| Util.deserialize(r[:payload]) }
  end
end
