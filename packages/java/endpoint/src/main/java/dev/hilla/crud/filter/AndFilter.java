package dev.hilla.crud.filter;

import java.util.List;

/**
 * A filter that requires all children to pass.
 */
public class AndFilter extends Filter {
    private List<Filter> children;

    public List<Filter> getChildren() {
        return children;
    }

    public void setChildren(List<Filter> children) {
        this.children = children;
    }

    @Override
    public String toString() {
        return "AndFilter [children=" + children + "]";
    }

}
