package dev.hilla.internal.fixtures;

import dev.hilla.internal.Endpoint;

/**
 * A test class.
 */
@Endpoint("WithoutValueEqual")
public class EndpointNoValue {

    /**
     * Foo endpoint.
     *
     * @param bar
     */
    public void foo(String bar) {
    }

    /**
     * Baz endpoint.
     *
     * @param baz
     * @return
     */
    public String bar(String baz) {
        return baz;
    }

}
