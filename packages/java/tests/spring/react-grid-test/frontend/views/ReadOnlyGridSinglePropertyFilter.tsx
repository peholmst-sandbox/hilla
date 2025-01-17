import { TextField } from '@hilla/react-components/TextField.js';
import { AutoGrid } from '@hilla/react-crud';
import { useState } from 'react';
import type FilterUnion from 'Frontend/generated/dev/hilla/crud/filter/FilterUnion.js';
import Matcher from 'Frontend/generated/dev/hilla/crud/filter/PropertyStringFilter/Matcher.js';
import PersonModel from 'Frontend/generated/dev/hilla/test/reactgrid/PersonModel.js';
import { PersonService } from 'Frontend/generated/endpoints.js';

export function ReadOnlyGridSinglePropertyFilter(): JSX.Element {
  const [filter, setFilter] = useState<FilterUnion | undefined>(undefined);
  return (
    <div>
      <TextField
        id="filter"
        label="Search for first name"
        onValueChanged={({ detail: { value } }) => {
          setFilter({
            '@type': 'propertyString',
            propertyId: 'firstName',
            matcher: Matcher.CONTAINS,
            filterValue: value,
          });
        }}
      ></TextField>
      <AutoGrid pageSize={10} service={PersonService} experimentalFilter={filter} model={PersonModel} noHeaderFilters />
    </div>
    /* page size is defined only to make testing easier */
  );
}
