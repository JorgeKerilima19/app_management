import { Menu_item } from "@/data/types";

export const MenuItem = ({ item }: { item: Menu_item }) => {
  return (
    <div key={item.id}>
      Hola este es el item {item.name}
      <div>
        <h2>y SOY DE LA CATEGORIA {item.category}</h2>
      </div>
    </div>
  );
};
