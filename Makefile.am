AUTOMAKE_OPTIONS = foreign

bin_PROGRAMS = oxide
oxide_SOURCES = main.cpp src/Server.cpp
oxide_CPPFLAGS = -I$(srcdir)/src

check_PROGRAMS = test_server
test_server_SOURCES = tests/test_server.cpp src/Server.cpp
test_server_CPPFLAGS = -I$(srcdir)/src
test_server_LDADD = -lgtest -lgtest_main -lpthread

TESTS = test_server

CLEANFILES = *.gcda *.gcno *.gcov lcov.info

.PHONY: coverage
coverage:
	$(MAKE) clean
	$(MAKE) CXXFLAGS="--coverage -O0" test_server
	./test_server || true
	lcov --directory . --capture --output-file lcov.info --ignore-errors inconsistent,source
	genhtml lcov.info --output-directory lcov-report --ignore-errors source
