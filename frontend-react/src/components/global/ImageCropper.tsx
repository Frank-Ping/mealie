import { useState } from "react";
import { Box, Button, Card, CardContent, Grid, List, ListItem, ListItemIcon } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { Cropper } from "vue-advanced-cropper";

interface Props {
  img: string;
  cropperWidth?: string;
  submitted?: boolean;
}

type Control = {
  color: string;

export default function ImageCropper({ img, cropperWidth = undefined, submitted = false }: Props) {
  import "vue-advanced-cropper/dist/style.css";

  /* props via generated interface + destructured signature */

  const emit = defineEmits<{
    (e: "save", item: Blob): void;
    (e: "delete"): void;
  }>();

  const [cropper, setCropper] = useState(null);
  const [changed, setChanged] = useState(0);
  // Left to the cropper's own sizing until the image is rotated; see rotate().
  const [aspectRatio, setAspectRatio] = useState("auto");
  // icons imported directly (was $globals)

  function onReady() {
    setAspectRatio("auto");
    setChanged(-1);
  }


    icon: string;
    callback: CallableFunction;
  };

  function flip(hortizontal: boolean, vertical?: boolean) {
    if (!cropper) return;
    cropper.flip(hortizontal, vertical);
    setChanged(changed + 1);
  }

  async function rotate(angle: number) {
    if (!cropper) return;
    cropper.rotate(angle);
    setChanged(changed + 1);

    // A quarter turn swaps the image's width and height. Pin the box to the new
    // orientation, otherwise the cropper keeps the visible area it computed for
    // the old one and part of the rotated image ends up outside of it.
    const { image } = cropper.getResult();
    const quarterTurned = Math.abs(image.transforms.rotate % 180) === 90;
    setAspectRatio(quarterTurned ? image.height / image.width : image.width / image.height);

    // the cropper measures its own box, so let the new size land first
    await /* WF4-REVIEW [J] */ nextTick();
    cropper.refresh();
  }

  const [controls, setControls] = useState([
    [
      {
        color: "info",
        icon: icons.flipHorizontal,
        callback: (); => flip(true, false),
      },
      {
        color: "info",
        icon: icons.flipVertical,
        callback: () => flip(false, true),
      },
    ],
    [
      {
        color: "info",
        icon: icons.rotateLeft,
        callback: () => rotate(-90),
      },
      {
        color: "info",
        icon: icons.rotateRight,
        callback: () => rotate(90),
      },
    ],
  ]);

  function save() {
    if (!cropper) return;
    const { canvas } = cropper.getResult();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        emit("save", blob);
      }
    });
  }

  function defaultSize({ imageSize, visibleArea }: any) {
    return {
      width: (visibleArea || imageSize).width,
      height: (visibleArea || imageSize).height,
    };
  }

  return (
    <>
  <Card className="ma-0 pt-2" elevation={4}>
    <CardContent>
      <Grid container className="mb-2 mx-1">
        <Button color="error" icon={$globals.icons.delete} disabled={submitted} onClick={onDelete?.()} />
        <Box sx={ flexGrow: 1 } />
        {(changed) ? (
          <Button className="mr-2" color="success" icon={$globals.icons.save} disabled={submitted} onClick={save} />
        ) : null}
        {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
        <VMenu offset-y close-on-content-click={false} location="bottom center">
          <template>
            <Button color="info" {...(slotProps)} icon={$globals.icons.edit} disabled={submitted} />
          </template>
          <List className="mt-1">
            {controls.map((row, keyRow) => (
              <template key={keyRow}>
                {/* WF4-REVIEW: unmapped <v-list-item-group> — judgement component, convert manually [J] */}
                <VListItemGroup>
                  {row.map((control, keyControl) => (
                    /* WF4-REVIEW: @click → ListItemButton */
                    <ListItem key={keyControl} disabled={submitted} onClick={control.callback()}>
                      <ListItemIcon>
                        {/* WF4-REVIEW: icon name resolves via lib/icons */}
                        <MdiIcon color={control.color} icon={control.icon} />
                      </ListItemIcon>
                    </ListItem>
                  ))}
                </VListItemGroup>
              </template>
            ))}
          </List>
        </VMenu>
      </Grid>
      <Cropper ref="cropper" className="cropper" src={img} default-size={defaultSize} style={`width: ${cropperWidth}; aspect-ratio: ${aspectRatio};`} onChange={changed = changed + 1} onReady={onReady} />
    </CardContent>
  </Card>
    </>
  );
}
