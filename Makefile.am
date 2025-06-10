AUTOMAKE_OPTIONS = foreign

AM_CXXFLAGS = -std=c++17

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
oxide_SOURCES = main.cpp $(SRC_MODULES)
oxide_CPPFLAGS = -I$(srcdir)/src

# GoogleTest sources (vendored)
GTEST_DIR = $(srcdir)/third_party/googletest/googletest
GTEST_SRCS = \
	$(GTEST_DIR)/src/gtest-all.cc
GTEST_OBJS = gtest-all.o
GTEST_CPPFLAGS = -I$(GTEST_DIR)/include -I$(GTEST_DIR)

check_PROGRAMS = test_server
test_server_SOURCES = tests/test_server.cpp tests/test_connection_manager.cpp tests/test_session_manager.cpp tests/test_custom1_helpers.cpp $(SRC_MODULES)
test_server_CPPFLAGS = -I$(srcdir)/src $(GTEST_CPPFLAGS)
test_server_LDADD = $(GTEST_OBJS) -lpthread

test_server_DEPENDENCIES = $(GTEST_OBJS)

TESTS = test_server

CLEANFILES = *.gcda *.gcno *.gcov lcov.info $(GTEST_OBJS) *.dirstamp src/*.gcda src/*.gcno tests/*.gcda tests/*.gcno

gtest-all.o: $(GTEST_DIR)/src/gtest-all.cc
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) $(GTEST_CPPFLAGS) -c -o $@ $<

.PHONY: coverage
coverage:
	find . -name '*.gcda' -delete
	find . -name '*.gcno' -delete
	find . -name '*.o' -delete
	$(MAKE) clean
	$(MAKE) AM_CXXFLAGS="--coverage -O0" test_server_LDFLAGS="--coverage" test_server
	./test_server || true
	lcov --directory . --capture --output-file lcov.info --ignore-errors inconsistent,source,mismatch
	lcov --remove lcov.info '/usr/include/*' '*/third_party/*' '*/tests/*' --output-file lcov.info
	genhtml lcov.info --output-directory lcov-report --ignore-errors source,mismatch

.PHONY: run
run: oxide
	./oxide

clean-local:
	rm -rf build/ out/
	find . -name '*.dirstamp' -delete

LIBS += -lcrypto -lcrypt
