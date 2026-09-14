// DỮ LIỆU WEBSITE LỚP 9.27
// Chỉ cần sửa file này khi muốn cập nhật nội dung. Không cần sửa HTML/CSS.

const students = [
  {
    "stt": 1,
    "name": "Bùi Thị Hoài An"
  },
  {
    "stt": 2,
    "name": "Nguyễn Gia Bảo"
  },
  {
    "stt": 3,
    "name": "Ngô Thanh Bình"
  },
  {
    "stt": 4,
    "name": "Nguyễn Hoàng Bảo Châu"
  },
  {
    "stt": 5,
    "name": "Nguyễn Phạm Khánh Chi"
  },
  {
    "stt": 6,
    "name": "Trần Uy Dũng"
  },
  {
    "stt": 7,
    "name": "Phan Đức Duy"
  },
  {
    "stt": 8,
    "name": "Nguyễn Minh Đăng"
  },
  {
    "stt": 9,
    "name": "Phạm Huỳnh Trường Giang"
  },
  {
    "stt": 10,
    "name": "Nguyễn Lê Gia Hào"
  },
  {
    "stt": 11,
    "name": "Đặng Phạm Gia Hân"
  },
  {
    "stt": 12,
    "name": "Nguyễn Thu Hiền"
  },
  {
    "stt": 13,
    "name": "Phùng Bá Hiệp"
  },
  {
    "stt": 14,
    "name": "Nguyễn Minh Hữu"
  },
  {
    "stt": 15,
    "name": "Bùi Minh Khang"
  },
  {
    "stt": 16,
    "name": "Đặng Nguyễn Ngọc Khánh"
  },
  {
    "stt": 17,
    "name": "Nguyễn Bá Khôi"
  },
  {
    "stt": 18,
    "name": "Nguyễn Trung Kiên"
  },
  {
    "stt": 19,
    "name": "Nguyễn Bá Kiệt"
  },
  {
    "stt": 20,
    "name": "Đào Huỳnh Bảo Lâm"
  },
  {
    "stt": 21,
    "name": "Nguyễn Hải Lân"
  },
  {
    "stt": 22,
    "name": "Nguyễn Lê Mai"
  },
  {
    "stt": 23,
    "name": "Phan Nguyễn Ngọc Mai"
  },
  {
    "stt": 24,
    "name": "Lữ Triều Minh"
  },
  {
    "stt": 25,
    "name": "Nguyễn Phạm Bảo Minh"
  },
  {
    "stt": 26,
    "name": "Lê Hồng Ngọc"
  },
  {
    "stt": 27,
    "name": "Hồ Hữu Khôi Nguyên"
  },
  {
    "stt": 28,
    "name": "Hoàng Gia Nguyễn"
  },
  {
    "stt": 29,
    "name": "Phan Thiện Nhân"
  },
  {
    "stt": 30,
    "name": "Nguyễn Thị Ngọc Nhi"
  },
  {
    "stt": 31,
    "name": "Nguyễn Yến Nhi"
  },
  {
    "stt": 32,
    "name": "Nguyễn Kim Oanh"
  },
  {
    "stt": 33,
    "name": "Nguyễn Đăng Phong"
  },
  {
    "stt": 34,
    "name": "Hoàng Nhật Quang"
  },
  {
    "stt": 35,
    "name": "Hoàng Lê Như Quỳnh"
  },
  {
    "stt": 36,
    "name": "Võ Đức Tài"
  },
  {
    "stt": 37,
    "name": "Nguyễn Hoàng Phương Thảo"
  },
  {
    "stt": 38,
    "name": "Phạm Anh Thư"
  },
  {
    "stt": 39,
    "name": "Nguyễn Đức Toàn"
  },
  {
    "stt": 40,
    "name": "Trần Thị Minh Trang"
  },
  {
    "stt": 41,
    "name": "Nguyễn Hoàng Thiên Trí"
  },
  {
    "stt": 42,
    "name": "Huỳnh Lê Thủy Trúc"
  },
  {
    "stt": 43,
    "name": "Phan Cẩm Vi"
  },
  {
    "stt": 44,
    "name": "Trần Quang Vinh"
  },
  {
    "stt": 45,
    "name": "Phạm Đăng Vương"
  },
  {
    "stt": 46,
    "name": "Nguyễn Thị Yến Vy"
  }
];
const seatPlan = [
  [
    "Phạm Anh Thư",
    "Nguyễn Lê Gia Hào",
    "Trần Thị Minh Trang",
    "Phạm Huỳnh Trường Giang",
    "Nguyễn Gia Bảo",
    "Phan Thiện Nhân",
    "Hoàng Lê Như Quỳnh",
    "Nguyễn Bá Khôi"
  ],
  [
    "Nguyễn Minh Hữu",
    "Ngô Thanh Bình",
    "Hồ Hữu Khôi Nguyên",
    "Nguyễn Hoàng Phương Thảo",
    "Phan Đức Duy",
    "Nguyễn Thu Hiền",
    "Nguyễn Phạm Khánh Chi",
    "Nguyễn Đăng Phong"
  ],
  [
    "Phạm Đăng Vương",
    "Bùi Thị Hoài An",
    "Nguyễn Trung Kiên",
    "Lê Hồng Ngọc",
    "Trần Uy Dũng",
    "Nguyễn Hoàng Bảo Châu",
    "Nguyễn Minh Đăng",
    "Đặng Phạm Gia Hân"
  ],
  [
    "Phan Nguyễn Ngọc Mai",
    "Nguyễn Hải Lân",
    "Nguyễn Lê Mai",
    "Nguyễn Hoàng Thiên Trí",
    "Nguyễn Phạm Bảo Minh",
    "Phan Cẩm Vi",
    "Đặng Nguyễn Ngọc Khánh",
    null
  ],
  [
    "Nguyễn Đức Toàn",
    "Phùng Bá Hiệp",
    "Võ Đức Tài",
    "Nguyễn Thị Yến Vy",
    "Nguyễn Thị Ngọc Nhi",
    "Hoàng Nhật Quang",
    "Trần Quang Vinh",
    "Huỳnh Lê Thủy Trúc"
  ],
  [
    null,
    "Hoàng Gia Nguyễn",
    "Lữ Triều Minh",
    "Nguyễn Kim Oanh",
    "Nguyễn Bá Kiệt",
    "Đào Huỳnh Bảo Lâm",
    "Nguyễn Yến Nhi",
    "Bùi Minh Khang"
  ]
];

var homework = [
  {
    day: "BTVN T6",
    date: "Hôm nay",
    items: [
      {
        subject: "Lịch sử & Địa lý",
        icon: "🌍",
        text: "Xem lại bài, cô kiểm trắc nghiệm."
      },
      {
        subject: "KHTN",
        icon: "🧪",
        text: "Làm hết bài 2 trong SBT KHTN, trừ các bài liên quan đến thế năng."
      },
      {
        subject: "Toán",
        icon: "📐",
        text: "Cô Ngọc đã nhắn rồi — tự lướt lên xem lại tin nhắn nhé."
      }
    ]
  }
];

var grades = {
  // Ví dụ cập nhật:
  // "Nguyễn Gia Bảo": { "Toán": [8, 9], "Ngữ văn": [8.5], "Tiếng Anh": [9] }
};

var violations = {
  week1: {
    label: "Tuần 1",
    items: []
  }
};

var duty = {
  status: "Chưa có dữ liệu",
  schedule: []
};
