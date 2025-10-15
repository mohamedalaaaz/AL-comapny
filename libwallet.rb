# lib/wallet.rb
require_relative 'util'

class Wallet
  attr_reader :key, :address

  def initialize(key = nil)
    if key
      @key = OpenSSL::PKey::EC.new(key)
    else
      @key = Util.generate_keypair
    end
    @address = Util.public_key_to_pem(@key) # simple address = public key PEM
  end

  def private_pem
    Util.private_key_to_pem(@key)
  end

  def sign(data)
    Util.sign(private_pem, data)
  end
end
