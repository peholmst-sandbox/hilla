package dev.hilla.crud.filter;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY)
@JsonSubTypes({ @Type(value = OrFilter.class, name = "or"),
        @Type(value = AndFilter.class, name = "and"),
        @Type(value = PropertyStringFilter.class, name = "propertyString") })
public class Filter {

}
