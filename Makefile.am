AUTOMAKE_OPTIONS = foreign

AM_CXXFLAGS = -std=c++17

AM_CPPFLAGS = -I./src -Ithird_party/crypt_blowfish

# List all C++ source files in src/ (update this list when adding/removing modules)
SRC_MODULES = \
	src/connection_manager.cpp \
	src/custom1_handlers.cpp \
	src/custom2_handlers.cpp \
	src/db_handler.cpp \
	src/logger.cpp \
	src/login.cpp \
	src/Server.cpp \
	src/http_handlers.cpp \
	src/session_manager.cpp \
	src/shard_manager.cpp

bin_PROGRAMS = oxide
oxide_SOURCES = main.cpp $(SRC_MODULES) third_party/libbcrypt/bcrypt.c \
    third_party/crypt_blowfish/crypt_blowfish.c \
    third_party/crypt_blowfish/crypt_gensalt.c \
    third_party/crypt_blowfish/wrapper.c
oxide_CPPFLAGS = -I$(srcdir)/src
oxide_LDFLAGS =
oxide_LDADD = -lsqlite3 -lpthread -lssl -lcrypto

# GoogleTest sources (vendored)
GTEST_DIR = $(srcdir)/third_party/googletest/googletest
GTEST_SRCS = \
	$(GTEST_DIR)/src/gtest-all.cc
GTEST_OBJS = gtest-all.o
GTEST_CPPFLAGS = -I$(GTEST_DIR)/include -I$(GTEST_DIR)

check_PROGRAMS = test_server
test_server_SOURCES = tests/test_server.cpp tests/test_connection_manager.cpp tests/test_session_manager.cpp tests/test_custom1_helpers.cpp tests/test_custom1_login.cpp tests/test_custom1_packet.cpp tests/test_login.cpp $(SRC_MODULES) third_party/libbcrypt/bcrypt.c \
    third_party/crypt_blowfish/crypt_blowfish.c \
    third_party/crypt_blowfish/crypt_gensalt.c \
    third_party/crypt_blowfish/wrapper.c
test_server_CPPFLAGS = -I$(srcdir)/src $(GTEST_CPPFLAGS)
test_server_LDFLAGS =
test_server_LDADD = $(GTEST_OBJS) -lpthread -lsqlite3 -lpthread -lssl -lcrypto

test_server_DEPENDENCIES = $(GTEST_OBJS)

# Build the custom1_decrypt_fixture guard test
noinst_PROGRAMS = custom1_decrypt_fixture
custom1_decrypt_fixture_SOURCES = src/custom1_decrypt_fixture.cpp
custom1_decrypt_fixture_LDADD = -lssl -lcrypto

# Add the guard test to the test suite
TESTS = test_server custom1_decrypt_fixture

# Ensure C sources are compiled with the C compiler, not C++
third_party_libbcrypt_bcrypt_c_CFLAGS = $(AM_CFLAGS)
third_party_crypt_blowfish_crypt_blowfish_c_CFLAGS = $(AM_CFLAGS)
third_party_crypt_blowfish_crypt_gensalt_c_CFLAGS = $(AM_CFLAGS)
third_party_crypt_blowfish_wrapper_c_CFLAGS = $(AM_CFLAGS)

# Required macros for crypt_blowfish and bcrypt portability
AM_CPPFLAGS += -DNO_BF_ASM -D_DEFAULT_SOURCE -DUSE_BCRYPT -DCRYPT_BLOWFISH

CLEANFILES = *.gcda *.gcno *.gcov lcov.info $(GTEST_OBJS) *.dirstamp src/*.gcda src/*.gcno tests/*.gcda tests/*.gcno

gtest-all.o: $(GTEST_DIR)/src/gtest-all.cc
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) $(GTEST_CPPFLAGS) -c -o $@ $<

.PHONY: coverage
coverage:
	find . -name '*.gcda' -delete
	find . -name '*.gcno' -delete
	find . -name '*.o' -delete
	$(MAKE) clean
	$(MAKE) AM_CXXFLAGS="--coverage -O0" test_server_LDFLAGS="--coverage" custom1_decrypt_fixture_LDFLAGS="--coverage" test_server custom1_decrypt_fixture
	./test_server
	./custom1_decrypt_fixture
	lcov --directory . --capture --output-file lcov.info --ignore-errors inconsistent,source,mismatch
	lcov --remove lcov.info '/usr/include/*' '*/third_party/*' '*/tests/*' --output-file lcov.info
	genhtml lcov.info --output-directory lcov-report --ignore-errors source,mismatch

.PHONY: run
run: oxide
	./oxide

clean-local:
	rm -rf build/ out/
	find . -name '*.dirstamp' -delete

LIBS =

prepatch:
	./patch_third_party.sh

# Ensure patches are applied before build and check
all: prepatch
check: prepatch
