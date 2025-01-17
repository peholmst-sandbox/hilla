import { _enum as _enum_1, EnumModel as EnumModel_1, makeEnumEmptyValueCreator as makeEnumEmptyValueCreator_1 } from "@hilla/form";
import FormEnumTypes_1 from "./FormEnumTypes.js";
class FormEnumTypesModel extends EnumModel_1<typeof FormEnumTypes_1> {
    static override createEmptyValue = makeEnumEmptyValueCreator_1(FormEnumTypesModel);
    readonly [_enum_1] = FormEnumTypes_1;
}
export default FormEnumTypesModel;
