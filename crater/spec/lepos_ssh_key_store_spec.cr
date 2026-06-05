require "./spec_helper"
require "../src/crater/ssh_key_store"

describe "Lepos SSH key store" do
  it "serializes multiple public keys with a legacy single-key mirror" do
    public_keys = [
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDemoKeyOne demo-one",
      "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDemoKeyTwo demo-two",
    ]
    records = [
      Lepos::SshKeyStore::KeyRecord.new("demo", public_keys[0], "2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z"),
      Lepos::SshKeyStore::KeyRecord.new("demo", public_keys[1], "2024-01-03T00:00:00Z", "2024-01-04T00:00:00Z"),
    ]

    payload = Lepos::SshKeyStore.to_json_payload("demo", records)

    payload["actorHandle"].as_s.should eq("demo")
    payload["publicKey"].as_s.should eq(public_keys[0])
    payload["publicKeys"].as_a.map(&.as_s).should eq(public_keys)
    payload["createdAt"].as_s.should eq("2024-01-01T00:00:00Z")
    payload["updatedAt"].as_s.should eq("2024-01-04T00:00:00Z")
  end

  it "serializes an empty key list after an actor clears SSH keys" do
    payload = Lepos::SshKeyStore.to_json_payload("@Demo", [] of Lepos::SshKeyStore::KeyRecord)

    payload["actorHandle"].as_s.should eq("demo")
    payload["publicKey"].as_s.should eq("")
    payload["publicKeys"].as_a.empty?.should be_true
  end
end
