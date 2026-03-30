import cv2
import numpy as np

src = cv2.imread('plan_b.png')
gray = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

# Remove text/small noise first
clean_kernel = np.ones((3,3), np.uint8)
clean_walls = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, clean_kernel, iterations=1)

# Horizontal and Vertical separation
horiz_kernel = np.ones((1, 25), np.uint8)
horiz_walls = cv2.morphologyEx(clean_walls, cv2.MORPH_OPEN, horiz_kernel)

vert_kernel = np.ones((25, 1), np.uint8)
vert_walls = cv2.morphologyEx(clean_walls, cv2.MORPH_OPEN, vert_kernel)

# Find contours
horiz_cnts, _ = cv2.findContours(horiz_walls, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
vert_cnts, _ = cv2.findContours(vert_walls, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

wall_rects = []
debug_img = src.copy()

for cnt in horiz_cnts:
    if cv2.contourArea(cnt) > 200:
        rect = cv2.minAreaRect(cnt)
        box = cv2.boxPoints(rect)
        wall_rects.append(np.array(box, dtype=int))
        cv2.drawContours(debug_img, [np.array(box, dtype=int)], 0, (0, 255, 0), 2)

for cnt in vert_cnts:
    if cv2.contourArea(cnt) > 200:
        rect = cv2.minAreaRect(cnt)
        box = cv2.boxPoints(rect)
        wall_rects.append(np.array(box, dtype=int))
        cv2.drawContours(debug_img, [np.array(box, dtype=int)], 0, (0, 0, 255), 2)

cv2.imwrite('debug_walls.png', debug_img)

with open('test_out.txt', 'w') as f:
    f.write(f"Walls found: {len(wall_rects)}\n")

# Write to disk to inspect if needed (will just verify pixel counts for now)
