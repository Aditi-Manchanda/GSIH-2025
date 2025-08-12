import sys
from PIL import Image
import numpy as np

def count_intersections(image_path):
    try:
        # Load grayscale image
        img = Image.open(image_path).convert('L')
        img_array = np.array(img)

        # Binary thresholding
        threshold = np.mean(img_array) * 0.8
        binary = (img_array < threshold).astype(np.uint8)

        height, width = binary.shape
        visited = np.zeros_like(binary)
        intersections = []

        # Sliding window to detect intersections
        for y in range(3, height - 3):
            for x in range(3, width - 3):
                if binary[y, x] == 0 or visited[y, x]:
                    continue

                # 3x3, 5x5, and 7x7 windows
                win_3x3 = binary[y-1:y+2, x-1:x+2]
                win_5x5 = binary[y-2:y+3, x-2:x+3]
                win_7x7 = binary[y-3:y+4, x-3:x+4]

                sum_3x3 = np.sum(win_3x3) - binary[y, x]
                sum_5x5 = np.sum(win_5x5) - binary[y, x]
                sum_7x7 = np.sum(win_7x7) - binary[y, x]

                # Heuristic: moderate density in 3x3 and 5x5 but avoid huge blobs
                if sum_3x3 >= 3 and sum_5x5 >= 6 and sum_7x7 <= 30:
                    intersections.append((x, y))
                    visited[y-3:y+4, x-3:x+4] = 1  # Mark region as visited

        # Cluster close points (avoid duplicates due to thick lines)
        final_points = []
        dist_sq = 36  # within 6px

        for x1, y1 in intersections:
            if not any((x1 - x2)**2 + (y1 - y2)**2 < dist_sq for x2, y2 in final_points):
                final_points.append((x1, y1))

        return len(final_points)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 0

if __name__ == "__main__":
    filename = sys.stdin.readline().strip()
    print(count_intersections(filename))
