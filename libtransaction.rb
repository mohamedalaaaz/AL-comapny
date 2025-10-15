# lib/transaction.rb
require_relative 'util'

class Transaction
  attr_accessor :id, :sender, :recipient, :amount, :signature, :timestamp

  def initialize(sender:, recipient:, amount:)
    @sender = sender   # address (public key PEM) or 'SYSTEM' for mining reward
    @recipient = recipient
    @amount = amount.to_f
    @timestamp = Util.current_time_iso
    @signature = nil
    @id = compute_id
  end

  def to_h
    {
      id: @id,
      sender: @sender,
      recipient: @recipient,
      amount: @amount,
      signature: @signature,
      timestamp: @timestamp
    }
  end

  def to_json(*_); JSON.generate(to_h); end

  def compute_id
    Util.sha256([@sender, @recipient, @amount, @timestamp].join)
  end

  def sign!(private_pem)
    @signature = Util.sign(private_pem, compute_id)
  end

  def valid?
    return true if @sender == 'SYSTEM' # coinbase tx
    return false if @signature.nil?
    Util.verify(@sender, compute_id, @signature)
  rescue
    false
  end
end
