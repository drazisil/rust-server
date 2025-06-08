cmake_minimum_required(VERSION 3.10)
project(oxide LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Enable code coverage flags if requested
option(CODE_COVERAGE "Enable coverage reporting" OFF)
if(CODE_COVERAGE)
    if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
        message(STATUS "Building with code coverage flags")
        add_compile_options(--coverage -O0)
        add_link_options(--coverage)
    endif()
endif()

add_executable(oxide
    main.cpp
    src/Server.cpp
)

include_directories(${CMAKE_SOURCE_DIR}/src)

# GoogleTest
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
)
# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

enable_testing()
add_executable(test_server tests/test_server.cpp src/Server.cpp)
target_include_directories(test_server PRIVATE src .)
target_link_libraries(test_server gtest_main)
add_test(NAME ServerTests COMMAND test_server)

# Coverage target
if(CODE_COVERAGE)
    find_program(LCOV_PATH lcov)
    find_program(GENHTML_PATH genhtml)
    if(LCOV_PATH AND GENHTML_PATH)
        add_custom_target(coverage
            COMMAND ${CMAKE_CTEST_COMMAND} --output-on-failure
            COMMAND ${LCOV_PATH} --directory ${CMAKE_BINARY_DIR} --capture --output-file ${CMAKE_SOURCE_DIR}/coverage/lcov.info --ignore-errors inconsistent
            COMMAND ${GENHTML_PATH} ${CMAKE_SOURCE_DIR}/coverage/lcov.info --output-directory ${CMAKE_SOURCE_DIR}/coverage/lcov-report
            WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
            COMMENT "Generating code coverage report with lcov and genhtml"
            DEPENDS test_server
        )
    endif()
endif()

