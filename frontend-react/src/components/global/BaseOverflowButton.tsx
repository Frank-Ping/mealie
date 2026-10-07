import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Divider, List, ListItem, ListItemText } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

interface Props {
  mode?: string;
  items: unknown[];
  disabled?: boolean;
  btnClass?: string;
  btnText?: string;
}

export interface MenuItem {
  text: string;
  icon?: string;
  to?: string;
  value?: string;
  event?: string;
  divider?: boolean;
  hide?: boolean;
}

type modes = "model" | "link" | "event";

export default function BaseOverflowButton({ mode = "model", items, disabled = false, btnClass = "", btnText = function () {
      return useI18n().t("general.actions"); }: Props) {
  const MODES = {
    model: "model",
    link: "link",
    event: "event",
  };





  const props = /* props via generated interface + destructured signature */

  const modelValue = defineModel({
    type: String,
    required: false,
    default: "",
  });

  const activeObj = useMemo(() => items.find(item => item === modelValue, []); // WF4-REVIEW: dependency array ?? {
      text: "DEFAULT",
      value: "",
    },
  );

  let startIndex = 0;
  items.forEach((item, index) => {
    if (item === modelValue) {
      startIndex = index;
    }
  });
  const [itemGroup, setItemGroup] = useState(startIndex);

  function setValue(v: MenuItem) {
    modelValue = v || "";
  }

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
  <VMenu offset-y>
    <template>
      <Button color="primary" {...({ ...hoverProps, ...$attrs })} className={btnClass} disabled={disabled}>
        {(activeObj.icon) ? (
          /* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */
          <MdiIcon name={activeObj.icon} />
        ) : null}
        {mode === MODES.model ? activeObj.text : btnText}
        {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "end" on <v-icon> */}
        <MdiIcon name={$globals.icons.chevronDown} />
      </Button>
    </template>
    {(mode === MODES.model) ? (
      <List value={itemGroup} onChange={setItemGroup} density="compact">
        {items.map((item, index) => (
          <template>
            {(!item.hide) ? (
              <div key={index}>
                {/* WF4-REVIEW: @click → ListItemButton */}
                <ListItem onClick={setValue(item)}>
                  {(item.icon) ? (
                    <template>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={item.icon} />
                    </template>
                  ) : null}
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {item.text}
                  </ListItemText>
                </ListItem>
                {(item.divider) ? (
                  <Divider key={`divider-${index}`} className="my-1" />
                ) : null}
              </div>
            ) : null}
          </template>
        ))}
      </List>
    ) : null}
    <List value={itemGroup} onChange={setItemGroup} density="compact">
      {items.map((item, index) => (
        <template>
          {(!item.hide) ? (
            <div key={index}>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem to={item.to}>
                {(item.icon) ? (
                  <template>
                    {/* WF4-REVIEW: icon name resolves via lib/icons */}
                    <MdiIcon name={item.icon} />
                  </template>
                ) : null}
                {/* WF4-REVIEW: content → primary prop */}
                <ListItemText>
                  {item.text}
                </ListItemText>
              </ListItem>
              {(item.divider) ? (
                <Divider key={`divider-${index}`} className="my-1" />
              ) : null}
            </div>
          ) : null}
        </template>
      ))}
    </List>
    <List density="compact">
      {items.map((item, index) => (
        <template>
          {(!item.hide) ? (
            <div key={index}>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem onClick={$emit(item.event)}>
                {(item.icon) ? (
                  <template>
                    {/* WF4-REVIEW: icon name resolves via lib/icons */}
                    <MdiIcon name={item.icon} />
                  </template>
                ) : null}
                {/* WF4-REVIEW: content → primary prop */}
                <ListItemText>
                  {item.text}
                </ListItemText>
              </ListItem>
              {(item.divider) ? (
                <Divider key={`divider-${index}`} className="my-1" />
              ) : null}
            </div>
          ) : null}
        </template>
      ))}
    </List>
  </VMenu>
    </>
  );
}
