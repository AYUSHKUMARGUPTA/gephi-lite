import { FC, useMemo } from "react";
import { ColorPartitionEditor } from "./ColorPartitionEditor";
import { ColorRankingEditor } from "./ColorRankingEditor";
import { ColorFixedEditor } from "./ColorFixedEditor";
import { ItemType } from "../../../core/types";
import { useAppearance, useAppearanceActions, useGraphDataset } from "../../../core/context/dataContexts";
import { DEFAULT_EDGE_COLOR, DEFAULT_NODE_COLOR } from "../../../core/appearance/utils";
import { FieldModel } from "../../../core/graph/types";

type colorMode = "fixed" | "quanti" | "quali" | "static";

export const ColorItem: FC<{ itemType: ItemType }> = ({ itemType }) => {
  const { nodeFields, edgeFields } = useGraphDataset();
  const appearance = useAppearance();
  const { setColorAppearance } = useAppearanceActions();

  const color = itemType === "nodes" ? appearance.nodesColor : appearance.edgesColor;
  const colorValue = color.type === "fixed" ? "fixed" : `${color.type}::${color.field}`;
  const baseValue = itemType === "nodes" ? DEFAULT_NODE_COLOR : DEFAULT_EDGE_COLOR;
  const fieldOptions = useMemo(() => {
    const allFields: FieldModel[] = itemType === "nodes" ? nodeFields : edgeFields;
    return allFields.flatMap((field) => {
      const options = [];
      if (!!field.quantitative)
        options.push({ id: `ranking::${field.id}`, label: !!field.qualitative ? `${field.id} (ranking)` : field.id });
      if (!!field.qualitative)
        options.push({
          id: `partition::${field.id}`,
          label: !!field.quantitative ? `${field.id} (partition)` : field.id,
        });
      return options;
    });
  }, [edgeFields, itemType, nodeFields]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <h3>Color</h3>
      <label htmlFor="colorMode">Set color from</label>
      <select
        id="colorMode"
        className="form-select"
        value={colorValue}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "fixed") {
            if (color.type !== "fixed") {
              setColorAppearance(itemType, {
                type: "fixed",
                value: baseValue,
              });
            }
          } else {
            const field = value.replace(/^[^:]+::/, "");
            const type = value.split("::")[0];

            if (type === "ranking") {
              setColorAppearance(itemType, {
                type,
                field,
                colorScalePoints: [],
              });
            } else {
              setColorAppearance(itemType, {
                type,
                field,
                colorPalette: {},
                missingColor: baseValue,
              });
            }
          }
        }}
      >
        <option value="fixed">fixed size</option>
        {fieldOptions.map(({ id, label }) => (
          <option value={id} key={id}>{label}</option>
        ))}
      </select>

      {color.type === "fixed" && (
        <ColorFixedEditor
          itemType={itemType}
          color={color}
          setColor={(newColor) => setColorAppearance(itemType, newColor)}
        />
      )}
      {color.type === "ranking" && (
        <ColorRankingEditor
          itemType={itemType}
          color={color}
          setColor={(newColor) => setColorAppearance(itemType, newColor)}
        />
      )}
      {color.type === "partition" && (
        <ColorPartitionEditor
          itemType={itemType}
          color={color}
          setColor={(newColor) => setColorAppearance(itemType, newColor)}
        />
      )}
    </form>
  );
};