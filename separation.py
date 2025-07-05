from pathlib import Path

import numpy as np
from PIL import Image


if __name__ == "__main__":
    while True:
        try:
            img = Image.open(filename := Path(input("Filename: ")))
            arr = np.array(img) / 255
            # gamma correction
            # to disable, comment the line below
            arr = 255 * ((arr>.04045) * ((arr+.055)/1.055)**2.4 + (arr<=.04045) * arr/12.92)
            Image.fromarray((arr @ [[.212671], [.715160], [.072169]]).squeeze().astype("uint8"), "L").save("images" / filename.with_suffix(".grayscale.png"))
            img = Image.fromarray(arr.astype("uint8"))
            img.save("images" / filename.with_suffix(".source.png"))
            arr = np.array(img.convert("LAB"))
            arr[:, :, 0] = 128
            Image.fromarray(arr, "LAB").convert("RGB").save("images" / filename.with_suffix(".color.png"))
        except:
            pass
