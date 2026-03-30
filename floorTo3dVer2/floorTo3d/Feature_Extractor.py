#Extracts walls, rooms, and openings from floor plan images using OpenCV.
#Generates raw data for graph construction and visualization. 
# Focuses on robust feature detection while minimizing noise from text and scale bars.


import cv2
import numpy as np

def extract_features(image_path):
    src = cv2.imread(image_path)
    gray = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)

    # 1. Threshold to isolate black ink
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # 2. Noise removal (preserve long lines, erase text/scale bar)
    kernel = np.ones((3,3), np.uint8)  # smaller kernel to keep thin walls
    clean_walls = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

    # 3. Bridge gaps (connect walls across doorways)
    bridge_kernel = np.ones((3,3), np.uint8)  # smaller closing kernel
    connected_structure = cv2.morphologyEx(clean_walls, cv2.MORPH_CLOSE, bridge_kernel)

    # ---------------- WALL DETECTION ----------------
    wall_rects = []

    # Split into horizontal and vertical components
    horiz_kernel = np.ones((1, 25), np.uint8)
    horiz_walls = cv2.morphologyEx(connected_structure, cv2.MORPH_OPEN, horiz_kernel)

    vert_kernel = np.ones((25, 1), np.uint8)
    vert_walls = cv2.morphologyEx(connected_structure, cv2.MORPH_OPEN, vert_kernel)

    # Find contours for horizontal and vertical walls individually
    horiz_cnts, _ = cv2.findContours(horiz_walls, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    vert_cnts, _ = cv2.findContours(vert_walls, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in horiz_cnts:
        if cv2.contourArea(cnt) > 30:  # lowered threshold to catch thin walls
            rect = cv2.minAreaRect(cnt)
            box = cv2.boxPoints(rect)
            wall_rects.append(np.array(box, dtype=int).tolist())

    for cnt in vert_cnts:
        if cv2.contourArea(cnt) > 30:
            rect = cv2.minAreaRect(cnt)
            box = cv2.boxPoints(rect)
            wall_rects.append(np.array(box, dtype=int).tolist())

    # ---------------- ROOM DETECTION ----------------
    rooms = []
    contours, hierarchy = cv2.findContours(connected_structure, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        if cv2.contourArea(cnt) > 800:  # lowered threshold to capture smaller rooms
            approx = cv2.approxPolyDP(cnt, 0.02*cv2.arcLength(cnt, True), True)
            rooms.append(np.squeeze(approx).tolist())

    # ---------------- OPENING DETECTION ----------------
    openings = []
    lines = cv2.HoughLinesP(connected_structure, 1, np.pi/180,
                             threshold=100, minLineLength=50, maxLineGap=3)
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
            # Heuristic: short line segments inside walls = doors/windows
            if 40 < length < 120:  # tightened range
                openings.append([(int(x1), int(y1)), (int(x2), int(y2))])

    # ---------------- DEBUG VISUALIZATION ----------------
    debug = src.copy()
    for wall in wall_rects:
        cv2.drawContours(debug, [np.array(wall)], -1, (0,0,255), 2)  # walls in red
    for room in rooms:
        cv2.polylines(debug, [np.array(room, dtype=np.int32)], True, (0,255,0), 2)  # rooms in green
    for opening in openings:
        cv2.line(debug, opening[0], opening[1], (255,0,0), 2)  # openings in blue

    cv2.imshow("Debug Features", debug)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    return {
        "walls": wall_rects,
        "rooms": rooms,
        "openings": openings
    }
