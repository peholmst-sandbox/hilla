import type { AbstractModel, DetachedModelConstructor } from '@hilla/form';
import {
  Grid,
  type GridDataProvider,
  type GridDataProviderCallback,
  type GridDataProviderParams,
  type GridDefaultItem,
  type GridElement,
  type GridProps,
} from '@hilla/react-components/Grid.js';
import { GridColumn } from '@hilla/react-components/GridColumn.js';
import { GridColumnGroup } from '@hilla/react-components/GridColumnGroup.js';
import { type JSX, type MutableRefObject, useEffect, useRef, useState } from 'react';
import { ColumnContext, type SortState } from './autogrid-column-context.js';
import { type ColumnOptions, getColumnOptions } from './autogrid-columns.js';
import { AutoGridRowNumberRenderer } from './autogrid-renderers.js';
import css from './autogrid.obj.css';
import type { ListService } from './crud';
import { HeaderSorter } from './header-sorter';
import { getIdProperty, getProperties, includeProperty, type PropertyInfo } from './property-info.js';
import type AndFilter from './types/dev/hilla/crud/filter/AndFilter.js';
import type FilterUnion from './types/dev/hilla/crud/filter/FilterUnion.js';
import type PropertyStringFilter from './types/dev/hilla/crud/filter/PropertyStringFilter.js';
import type Sort from './types/dev/hilla/mappedtypes/Sort.js';
import Direction from './types/org/springframework/data/domain/Sort/Direction.js';

document.adoptedStyleSheets.unshift(css);

interface AutoGridOwnProps<TItem> {
  /**
   * The service to use for fetching the data. This must be a TypeScript service
   * that has been generated by Hilla from a backend Java service that
   * implements the `dev.hilla.crud.ListService` interface.
   */
  service: ListService<TItem>;
  /**
   * The entity model to use for the grid, which determines which columns to
   * show and how to render them. This must be a Typescript model class that has
   * been generated by Hilla from a backend Java class. The model must match
   * with the type of the items returned by the service. For example, a
   * `PersonModel` can be used with a service that returns `Person` instances.
   *
   * By default, the grid shows columns for all properties of the model which
   * have a type that is supported. Use the `visibleColumns` option to customize
   * which columns to show and in which order.
   */
  model: DetachedModelConstructor<AbstractModel<TItem>>;
  /**
   * Allows to provide a filter that is applied when fetching data from the
   * service. This can be used for implementing an external filter UI outside
   * the grid. A custom filter is not compatible with header filters.
   *
   * **NOTE:** This is considered an experimental feature and the API may change
   * in the future.
   */
  experimentalFilter?: FilterUnion;
  /**
   * Allows to customize which columns to show and in which order. This must be
   * an array of property names that are defined in the model. Nested properties
   * can be specified using dot notation, e.g. `address.street`.
   */
  visibleColumns?: string[];
  /**
   * Disables header filters, which are otherwise enabled by default.
   */
  noHeaderFilters?: boolean;
  /**
   * Can be used to force the grid to reload data. Passing a different value
   * between renders will trigger a reload.
   */
  refreshTrigger?: number;
  /**
   * Allows to add custom columns to the grid. This must be an array of
   * `GridColumn` component instances. Custom columns are added after the
   * auto-generated columns.
   */
  customColumns?: JSX.Element[];
  /**
   * Allows to customize the props for individual columns. This is an object
   * where the keys must be property names that are defined in the model, and
   * the values are props that are accepted by the `GridColumn` component.
   * Nested properties can be specified using dot notation, e.g.
   * `address.street`.
   */
  columnOptions?: Record<string, ColumnOptions>;
  /**
   * When enabled, inserts a column with row numbers at the beginning of the
   * grid.
   */
  rowNumbers?: boolean;
}

export type AutoGridProps<TItem> = GridProps<TItem> & Readonly<AutoGridOwnProps<TItem>>;

type GridElementWithInternalAPI<TItem = GridDefaultItem> = GridElement<TItem> &
  Readonly<{
    _cache: {
      size?: number;
    };
  }>;

function createDataProvider<TItem>(
  grid: GridElement<TItem>,
  service: ListService<TItem>,
  filter: MutableRefObject<FilterUnion | undefined>,
): GridDataProvider<TItem> {
  let first = true;

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return async (params: GridDataProviderParams<TItem>, callback: GridDataProviderCallback<TItem>) => {
    const sort: Sort = {
      orders: params.sortOrders
        .filter((order) => order.direction != null)
        .map((order) => ({
          property: order.path,
          direction: order.direction === 'asc' ? Direction.ASC : Direction.DESC,
          ignoreCase: false,
        })),
    };

    const pageNumber = params.page;
    const { pageSize } = params;
    const req = {
      pageNumber,
      pageSize,
      sort,
    };

    const items = await service.list(req, filter.current);
    let size;
    if (items.length === pageSize) {
      size = (pageNumber + 1) * pageSize + 1;

      const cacheSize = (grid as GridElementWithInternalAPI<TItem>)._cache.size;
      if (cacheSize !== undefined && size < cacheSize) {
        // Only allow size to grow here to avoid shrinking the size when scrolled down and sorting
        size = undefined;
      }
    } else {
      size = pageNumber * pageSize + items.length;
    }
    callback(items, size);
    if (first) {
      // Workaround for https://github.com/vaadin/react-components/issues/129
      first = false;
      setTimeout(() => grid.recalculateColumnWidths(), 0);
    }
  };
}

function useColumns(
  properties: PropertyInfo[],
  setPropertyFilter: (propertyFilter: PropertyStringFilter) => void,
  options: {
    visibleColumns?: string[];
    noHeaderFilters?: boolean;
    customColumns?: JSX.Element[];
    columnOptions?: Record<string, ColumnOptions>;
    rowNumbers?: boolean;
  },
) {
  const effectiveColumns = options.visibleColumns ?? properties.filter(includeProperty).map((p) => p.name);
  const effectiveProperties = effectiveColumns
    .map((name) => properties.find((prop) => prop.name === name))
    .filter(Boolean) as PropertyInfo[];

  const [sortState, setSortState] = useState<SortState>(
    effectiveProperties.length > 0 ? { [effectiveProperties[0].name]: { direction: 'asc' } } : {},
  );

  let columns = effectiveProperties.map((propertyInfo) => {
    let column;

    const customColumnOptions = options.columnOptions ? options.columnOptions[propertyInfo.name] : undefined;

    // Header renderer is effectively the header filter, which should only be
    // applied when header filters are enabled
    const { headerRenderer, ...columnProps } = getColumnOptions(propertyInfo, customColumnOptions);

    if (!options.noHeaderFilters) {
      column = (
        <GridColumnGroup headerRenderer={HeaderSorter}>
          <GridColumn path={propertyInfo.name} headerRenderer={headerRenderer} {...columnProps}></GridColumn>
        </GridColumnGroup>
      );
    } else {
      column = <GridColumn path={propertyInfo.name} headerRenderer={HeaderSorter} {...columnProps}></GridColumn>;
    }
    return (
      <ColumnContext.Provider
        key={propertyInfo.name}
        value={{ propertyInfo, setPropertyFilter, sortState, setSortState, customColumnOptions }}
      >
        {column}
      </ColumnContext.Provider>
    );
  });

  if (options.customColumns) {
    columns = [...columns, ...options.customColumns];
  }

  if (options.rowNumbers) {
    columns = [<GridColumn key="rownumbers" width="4em" renderer={AutoGridRowNumberRenderer}></GridColumn>, ...columns];
  }

  return columns;
}

/**
 * Auto Grid is a component for displaying tabular data based on a Java backend
 * service. It automatically generates columns based on the properties of a
 * Java class and provides features such as lazy-loading, sorting and filtering.
 *
 * Example usage:
 * ```tsx
 * import { AutoGrid } from '@hilla/react-crud';
 * import PersonService from 'Frontend/generated/endpoints';
 * import PersonModel from 'Frontend/generated/com/example/application/Person';
 *
 * <AutoGrid service={PersonService} model={PersonModel} />
 * ```
 */
export function AutoGrid<TItem>({
  service,
  model,
  experimentalFilter,
  visibleColumns,
  noHeaderFilters,
  refreshTrigger = 0,
  customColumns,
  columnOptions,
  rowNumbers,
  ...gridProps
}: AutoGridProps<TItem>): JSX.Element {
  const [internalFilter, setInternalFilter] = useState<AndFilter>({ '@type': 'and', children: [] });

  const setHeaderPropertyFilter = (propertyFilter: PropertyStringFilter) => {
    const filterIndex = internalFilter.children.findIndex(
      (f) => (f as PropertyStringFilter).propertyId === propertyFilter.propertyId,
    );
    let changed = false;
    if (propertyFilter.filterValue === '') {
      // Delete empty filter
      if (filterIndex >= 0) {
        internalFilter.children.splice(filterIndex, 1);
        changed = true;
      }
    } else if (filterIndex >= 0) {
      internalFilter.children[filterIndex] = propertyFilter;
      changed = true;
    } else {
      internalFilter.children.push(propertyFilter);
      changed = true;
    }
    if (changed) {
      setInternalFilter({ ...internalFilter });
    }
  };

  const properties = getProperties(model);
  const children = useColumns(properties, setHeaderPropertyFilter, {
    visibleColumns,
    noHeaderFilters,
    customColumns,
    columnOptions,
    rowNumbers,
  });

  useEffect(() => {
    // Remove all filtering if header filters are removed
    if (noHeaderFilters) {
      setInternalFilter({ '@type': 'and', children: [] });
    }
  }, [noHeaderFilters]);

  const ref = useRef<GridElement<TItem>>(null);
  const dataProviderFilter = useRef<FilterUnion | undefined>(undefined);

  useEffect(() => {
    // Sets the data provider, should be done only once
    const grid = ref.current!;
    setTimeout(() => {
      // Wait for the sorting headers to be rendered so that the sorting state is correct for the first data provider call
      grid.dataProvider = createDataProvider(grid, service, dataProviderFilter);
    }, 1);
  }, [model, service]);

  useEffect(() => {
    // Update the filtering, whenever the filter changes
    const grid = ref.current;
    if (grid) {
      dataProviderFilter.current = experimentalFilter ?? internalFilter;
      grid.clearCache();
    }
  }, [experimentalFilter, internalFilter, refreshTrigger]);

  return (
    <Grid itemIdPath={getIdProperty(properties)?.name} {...gridProps} ref={ref}>
      {children}
    </Grid>
  );
}
