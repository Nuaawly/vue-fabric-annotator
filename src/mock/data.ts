export const mockImageList = [
    {
        id: 1,
        originalUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop", 
        originalName: "red_nike_shoes.jpg",
        isSaved: false,
        // 模拟已有的标注结果
        segmentResults: [
            {
                rectId: "mock_1",
                objectName: "Shoe",
                // AABB 格式模拟
                axisAlignedBbox: JSON.stringify([[300, 200], [600, 500]]),
            }
        ]
    },
    {
        id: 2,
        originalUrl: "../../public/demo.jpeg",
        originalName: "deer.jpeg",
        isSaved: true,
        segmentResults: [
            {
                rectId: "mock_2",
                objectName: "Deer",
                // OBB 格式模拟 (旋转矩形)
                orientedBbox: JSON.stringify([
                    [200, 300], [500, 350], [450, 600], [150, 550]
                ]),
            }
        ]
    }
];
