import { db } from "../db/index";
import { markets } from "../../drizzle/schema";

export const getAllMarketsdata = async () => {
  const data = await db.select().from(markets);
  return data;
};
