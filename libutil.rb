# lib/util.rb
require 'digest'
require 'json'
require 'base64'
require 'openssl'

module Util
  def self.sha256(data)
    Digest::SHA256.hexdigest(data)
  end

  def self.current_time_iso
    Time.now.utc.iso8601
  end

  def self.serialize(obj)
    JSON.generate(obj)
  end

  def self.deserialize(str)
    JSON.parse(str)
  end

  # ECDSA helpers
  def self.generate_keypair
    ec = OpenSSL::PKey::EC.new('prime256v1')
    ec.generate_key
    ec
  end

  def self.public_key_to_pem(key)
    key.public_key.to_pem
  end

  def self.private_key_to_pem(key)
    key.to_pem
  end

  def self.sign(private_key_pem, data)
    key = OpenSSL::PKey::EC.new(private_key_pem)
    digest = OpenSSL::Digest::SHA256.new
    sig = key.dsa_sign_asn1(digest.digest(data))
    Base64.strict_encode64(sig)
  end

  def self.verify(public_key_pem, data, signature_b64)
    key = OpenSSL::PKey::EC.new(public_key_pem)
    digest = OpenSSL::Digest::SHA256.new
    sig = Base64.strict_decode64(signature_b64)
    key.public_key.dsa_verify_asn1(digest.digest(data), sig)
  end
end
