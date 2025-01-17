package dev.hilla.startup;

import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;

import java.util.HashSet;
import java.util.Set;

import dev.hilla.Endpoint;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mockito;

public class EndpointsValidatorTest {

    @Endpoint
    public static class WithConnectEndpoint {
    }

    public static class WithoutConnectEndpoint {
    }

    private Set<Class<?>> classes;
    private ServletContext servletContext;

    @Rule
    public ExpectedException exception = ExpectedException.none();

    @Before
    public void setup() {
        classes = new HashSet<Class<?>>();
        servletContext = Mockito.mock(ServletContext.class);
    }

    @Test
    public void should_start_when_spring_in_classpath() throws Exception {
        EndpointsValidator validator = new EndpointsValidator();
        classes.add(WithConnectEndpoint.class);
        validator.process(classes, servletContext);
    }

    @Test
    public void should_trow_when_spring_not_in_classpath() throws Exception {
        exception.expect(ServletException.class);
        EndpointsValidator validator = new EndpointsValidator();
        validator.setClassToCheck("foo.bar.Baz");
        classes.add(WithConnectEndpoint.class);
        validator.process(classes, servletContext);

    }

    @Test
    public void should_start_when_no_endpoints_and_spring_not_in_classpath()
            throws Exception {
        EndpointsValidator validator = new EndpointsValidator();
        classes.add(WithoutConnectEndpoint.class);
        validator.process(classes, servletContext);
    }

    @Test
    public void should_start_when_CDI_environment() throws Exception {
        EndpointsValidator validator = new EndpointsValidator();
        classes = null;
        validator.process(classes, servletContext);
    }
}
