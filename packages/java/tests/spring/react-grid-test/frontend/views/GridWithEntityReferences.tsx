import { AutoGrid } from '@hilla/react-crud';
import EmployeeModel from 'Frontend/generated/dev/hilla/test/reactgrid/entityreferences/EmployeeModel.js';
import { EmployeeService } from 'Frontend/generated/endpoints.js';

export function GridWithEntityReferences(): JSX.Element {
  return <AutoGrid pageSize={10} service={EmployeeService} model={EmployeeModel} noHeaderFilters />;
  /* page size is defined only to make testing easier */
}
