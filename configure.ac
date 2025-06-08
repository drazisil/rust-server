AC_INIT([oxide], [1.0], [your@email.com])
AM_INIT_AUTOMAKE([foreign subdir-objects])
AC_CONFIG_SRCDIR([main.cpp])
AC_CONFIG_HEADERS([config.h])

# Checks for programs.
AC_PROG_CXX
AC_PROG_CC
AC_PROG_INSTALL
AC_PROG_MAKE_SET

# Checks for libraries.
AC_CHECK_LIB([pthread], [pthread_create])
# Checks for SQLite3
AC_CHECK_LIB([sqlite3], [sqlite3_open], [], [
  AC_MSG_ERROR([sqlite3 library not found. Please install libsqlite3-dev or equivalent.])
])
# PKG_CHECK_MODULES for OpenSSL
PKG_CHECK_MODULES([OPENSSL], [openssl], [
  CFLAGS="$CFLAGS $OPENSSL_CFLAGS"
  LIBS="$LIBS $OPENSSL_LIBS"
], [
  AC_MSG_ERROR([OpenSSL (libssl/libcrypto) not found. Please install libssl-dev and pkg-config.])
])

# Checks for header files.
AC_CHECK_HEADERS([sys/types.h sys/socket.h netinet/in.h unistd.h string.h])
AC_CHECK_HEADER([sqlite3.h], [], [
  AC_MSG_ERROR([sqlite3.h header not found. Please install libsqlite3-dev or equivalent.])
])
AC_CHECK_HEADER([openssl/evp.h], [], [
  AC_MSG_ERROR([openssl/evp.h header not found. Please install libssl-dev or equivalent.])
])
AC_CHECK_HEADER([crypt.h], [], [
  AC_MSG_ERROR([crypt.h header not found. Please install libxcrypt-dev or equivalent.])
])

# Checks for typedefs, structures, and compiler characteristics.
AC_TYPE_SIZE_T

# Checks for library functions.
AC_CHECK_FUNCS([socket bind listen accept send close setsockopt])

AC_CONFIG_FILES([Makefile])
AC_OUTPUT
