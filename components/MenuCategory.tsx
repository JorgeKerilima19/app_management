"use client";

import { Menu_item } from "@/data/types";
import { MenuItem } from "./MenuItem";
import { useState } from "react";
import { data } from "@/data";

export const MenuCategory = () => {
  const [menuData, setMenuData] = useState<Menu_item[]>(data);

  console.log(menuData);

  return (
    <div>
      <h2>Categoria 2</h2>
      {menuData.map((item) => (
        <MenuItem item={item} />
      ))}
    </div>
  );
};
