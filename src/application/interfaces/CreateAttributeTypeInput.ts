import { AttributeType } from "../../types/attributes/type.attribute-type";

export interface CreateAttributeTypeInput
  extends Omit<AttributeType, "id" | "tenantId"> {
  tenantId: string;
}
