AUTOMAKE_OPTIONS = foreign

bin_PROGRAMS = oxide
oxide_SOURCES = main.cpp src/Server.cpp
oxide_CPPFLAGS = -I$(srcdir)/src

# GoogleTest sources (vendored)
GTEST_DIR = $(srcdir)/third_party/googletest/googletest
GTEST_SRCS = \
	$(GTEST_DIR)/src/gtest-all.cc \
	$(GTEST_DIR)/src/gtest_main.cc
GTEST_OBJS = gtest-all.o gtest_main.o
GTEST_CPPFLAGS = -I$(GTEST_DIR)/include -I$(GTEST_DIR)

check_PROGRAMS = test_server
test_server_SOURCES = tests/test_server.cpp src/Server.cpp
test_server_CPPFLAGS = -I$(srcdir)/src $(GTEST_CPPFLAGS)
test_server_LDADD = $(GTEST_OBJS) -lpthread

test_server_DEPENDENCIES = $(GTEST_OBJS)

TESTS = test_server

CLEANFILES = *.gcda *.gcno *.gcov lcov.info $(GTEST_OBJS)

# Build rules for GoogleTest objects
gtest-all.o: $(GTEST_DIR)/src/gtest-all.cc
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) $(GTEST_CPPFLAGS) -c -o $@ $<

gtest_main.o: $(GTEST_DIR)/src/gtest_main.cc
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) $(GTEST_CPPFLAGS) -c -o $@ $<

.PHONY: coverage
coverage:
	$(MAKE) clean
	$(MAKE) CXXFLAGS="--coverage -O0" test_server
	./test_server || true
	lcov --directory . --capture --output-file lcov.info --ignore-errors inconsistent,source
	genhtml lcov.info --output-directory lcov-report --ignore-errors source
