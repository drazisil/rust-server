#include "custom1_handlers.hpp"
#include <gtest/gtest.h>
#include <vector>
#include <string>
#include <openssl/evp.h>
#include <openssl/pem.h>


TEST(Custom1HelpersTest, HexToBinValid) {
    std::vector<unsigned char> out;
    std::string err;
    EXPECT_TRUE(hex_to_bin("4f2a", out, &err));
    ASSERT_EQ(out.size(), 2);
    EXPECT_EQ(out[0], 0x4f);
    EXPECT_EQ(out[1], 0x2a);
}

TEST(Custom1HelpersTest, HexToBinInvalidChar) {
    std::vector<unsigned char> out;
    std::string err;
    EXPECT_FALSE(hex_to_bin("4g", out, &err));
    EXPECT_NE(err.find("Non-hex character"), std::string::npos);
}

TEST(Custom1HelpersTest, HexToBinOddLength) {
    std::vector<unsigned char> out;
    std::string err;
    EXPECT_FALSE(hex_to_bin("abc", out, &err));
    EXPECT_NE(err.find("odd length"), std::string::npos);
}

// For load_private_key and rsa_oaep_decrypt, you would need a test key and test vector.
// Here is a placeholder for structure:
TEST(Custom1HelpersTest, LoadPrivateKeyFail) {
    std::string err;
    EVP_PKEY* pkey = load_private_key("/does/not/exist.pem", &err);
    EXPECT_EQ(pkey, nullptr);
    EXPECT_NE(err.find("Failed to open private key file"), std::string::npos);
}

// Decryption test would require a known-good key and ciphertext.
// You can add such a test with a test key in the repo if desired.
TEST(Custom1HelpersTest, DecryptKnownGoodVector) {
    std::string encrypted_hex = "921bed1340e5b80fa99174cbca17b70bad2a699c69391ca5f0ff86393eb20a5a920840ecc04126c1a15efe226de5b7e3dbb3faf9e8b2e7710fa799b35f4473789080d92c91c393af4d3d327802f212851d888a87c663182554abe32d969eab52957e2bb1539a45c13e1e2ea00941f4f48ca3a11cf9a61c55dad2b08dfd5cf9d4";
    std::string expected_decrypted = "002012b88837609be6fece4967fc8eea92a285ab21b96953de991e90ad2a4917108d00000000";
    std::vector<unsigned char> encrypted;
    std::string hex_err;
    ASSERT_TRUE(hex_to_bin(encrypted_hex, encrypted, &hex_err)) << hex_err;

    std::string key_err;
    EVP_PKEY* pkey = load_private_key("data/private_key.pem", &key_err);
    ASSERT_NE(pkey, nullptr) << key_err;

    std::vector<unsigned char> decrypted;
    std::string dec_err;
    ASSERT_TRUE(rsa_oaep_decrypt(pkey, encrypted, decrypted, &dec_err)) << dec_err;
    EVP_PKEY_free(pkey);

    // Convert full decrypted buffer to hex string
    std::string decrypted_hex;
    for (unsigned char c : decrypted) {
        char buf[3];
        snprintf(buf, sizeof(buf), "%02x", c);
        decrypted_hex += buf;
    }
    EXPECT_EQ(decrypted_hex, expected_decrypted);
}
