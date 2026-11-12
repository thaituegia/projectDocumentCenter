// Trusted synthetic fixtures. All exported originals are genuine PDFs, never disguised Office/media files.
export const sampleGroups = [
  [
    "hsk1-lessons",
    "HSK 1 · Bài học dùng thử",
    "books",
    "hsk1",
    [
      "Chào hỏi và giới thiệu bản thân",
      "Số đếm và ngày tháng",
      "Gia đình của tôi",
      "Đồ vật trong lớp học",
      "Hỏi đường đến thư viện",
    ],
  ],
  [
    "hsk1-exercises",
    "HSK 1 · Bài tập dùng thử",
    "books",
    "hsk1",
    [
      "Phiếu ôn tập chào hỏi",
      "Bài tập nối từ với nghĩa",
      "Điền từ vào hội thoại",
      "Đề luyện tập cuối tuần",
      "Bài tập nâng cao bị giới hạn",
    ],
  ],
  [
    "hsk2-course",
    "HSK 2 · Học liệu dùng thử",
    "books",
    "hsk2",
    [
      "Mua sắm và giá cả",
      "Giao tiếp trong nhà hàng",
      "Đọc hiểu chuyến đi cuối tuần",
      "Kế hoạch học tập tháng tới",
      "Tài liệu ôn tập bản cũ",
    ],
  ],
  [
    "hsk3-course",
    "HSK 3 · Học liệu dùng thử",
    "books",
    "hsk3",
    [
      "Công việc và nghề nghiệp",
      "Kể chuyện một ngày đáng nhớ",
      "Bài tập so sánh",
      "Phiếu đánh giá năng lực",
      "Nội dung phát hành tháng sau",
    ],
  ],
  [
    "hsk4-course",
    "HSK 4 · Học liệu dùng thử",
    "books",
    "hsk4",
    [
      "Bảo vệ môi trường",
      "Thuyết trình về sở thích",
      "Luyện viết đoạn văn",
      "Hướng dẫn phân tích đề",
      "Tự đánh giá tiến độ học",
    ],
  ],
  [
    "culture-pack",
    "Văn hóa · Tài liệu dùng thử",
    "books",
    "culture",
    [
      "Tết và phong tục đón năm mới",
      "Văn hóa trà qua góc nhìn người học",
      "Ứng xử khi làm việc nhóm",
      "Gợi ý tổ chức câu lạc bộ",
      "Từ vựng về món ăn",
    ],
  ],
  [
    "common-onboarding",
    "Công ty · Hội nhập dùng thử",
    "common",
    "process",
    [
      "Sổ tay hội nhập nhân viên",
      "Hướng dẫn sử dụng kho tài liệu",
      "Quy tắc đặt tên và lưu trữ file",
      "Quy trình tiếp nhận nhân sự mới",
      "Checklist tuần làm việc đầu tiên",
    ],
  ],
  [
    "common-process",
    "Công ty · Quy trình dùng thử",
    "common",
    "process",
    [
      "Quy trình đề nghị mua sắm",
      "Hướng dẫn tổ chức cuộc họp",
      "Biểu mẫu bàn giao công việc",
      "Quy trình cập nhật tài liệu",
      "Biểu mẫu cũ cần phục hồi",
    ],
  ],
  [
    "hr-records",
    "HCNS · Hồ sơ giả lập",
    "hr",
    "policies",
    [
      "Hồ sơ nhân sự mẫu NV-UAT-001",
      "Phiếu đánh giá thử việc mẫu",
      "Bảng tổng hợp đào tạo nhân viên",
      "Đề xuất điều chuyển nhân sự",
      "Quy trình nhân sự đã hết hiệu lực",
    ],
  ],
  [
    "hr-policies",
    "HCNS · Chính sách dùng thử",
    "hr",
    "policies",
    [
      "Quy trình xin nghỉ phép mẫu",
      "Hướng dẫn cập nhật hồ sơ cá nhân",
      "Chính sách đào tạo nội bộ mẫu",
      "Dự thảo hướng dẫn chấm công",
      "Chính sách áp dụng từ tháng sau",
    ],
  ],
  [
    "marketing-campaign",
    "Marketing · Chiến dịch dùng thử",
    "marketing",
    "campaign",
    [
      "Kế hoạch chiến dịch tuyển sinh mẫu",
      "Brief nội dung truyền thông mẫu",
      "Lịch nội dung bốn tuần",
      "Đề xuất chiến dịch cần phê duyệt",
      "Hướng dẫn chiến dịch đã hết hiệu lực",
    ],
  ],
  [
    "marketing-assets",
    "Marketing · Biểu mẫu dùng thử",
    "marketing",
    "campaign",
    [
      "Quy chuẩn nội dung bài đăng",
      "Phiếu yêu cầu thiết kế mẫu",
      "Báo cáo hiệu quả chiến dịch mẫu",
      "Dự thảo thông điệp truyền thông",
      "Biểu mẫu truyền thông đã xóa",
    ],
  ],
];

export function sampleDocuments(reference = new Date()) {
  const at = (days) =>
    new Date(reference.getTime() + days * 86400000).toISOString();
  return sampleGroups.flatMap(
    ([slug, folderName, repository, parent, titles], group) =>
      titles.map((title, index) => {
        const id = `uat-${slug}-${String(index + 1).padStart(2, "0")}`;
        const pending = index === 3 && group % 2 === 0;
        const publication =
          index === 3 ? (pending ? "PENDING_APPROVAL" : "DRAFT") : "PUBLISHED";
        const deleted = index === 4 && [7, 11].includes(group);
        const expired = index === 4 && [2, 8, 10].includes(group);
        const scheduled = index === 4 && [3, 9].includes(group);
        const versioned = index === 2 && [0, 1, 8, 10].includes(group);
        const isPublic = index === 0 && [0, 5].includes(group);
        const level = parent.match(/^hsk(\d)$/)?.[1];
        const warning =
          "DỮ LIỆU MẪU UAT · Không chứa thông tin thật · Không áp dụng trong vận hành";
        const sections =
          repository === "books"
            ? [
                "Mục tiêu: đọc hiểu nội dung, tìm tài liệu theo tên và thực hành đúng quyền truy cập.",
                "Bối cảnh: Nhân vật A và B là nhân vật giả lập trong một lớp học tiếng Trung. Nội dung do hệ thống tạo phục vụ dùng thử, không trích từ sách thương mại.",
                `Chủ đề thực hành: ${title}. Người học đọc tình huống, ghi lại ba từ khóa và trình bày ý chính bằng lời của mình.`,
                "Hoạt động 1: Chọn ba từ phù hợp với chủ đề và đặt câu đơn giản. Hoạt động 2: làm việc theo cặp, luân phiên đặt câu hỏi và trả lời. Hoạt động 3: đọc lại và tự sửa lỗi.",
                "Gợi ý tự đánh giá: Tôi hiểu được mục tiêu bài học; tôi hoàn thành được ví dụ; tôi biết phần nào cần luyện tập thêm.",
              ]
            : repository === "hr"
              ? [
                  "Bối cảnh giả lập: nhân viên NV-UAT-001 thuộc Phòng Mẫu. Mọi mã nhân sự, nhận xét và thông tin trong tài liệu đều hư cấu; không có số căn cước, số điện thoại, địa chỉ hoặc dữ liệu lương thật.",
                  `Phạm vi hồ sơ: ${title}. Người phụ trách HCNS kiểm tra phiên bản, hiệu lực và quyền trước khi chia sẻ.`,
                  "Quy trình mẫu: tiếp nhận yêu cầu → đối chiếu thông tin → chuyển người được giao phê duyệt → cập nhật trạng thái → lưu hồ sơ trong đúng thư mục.",
                  "Tiêu chí dùng thử: Admin HCNS quản lý hồ sơ trong kho HCNS; nhân viên chưa được cấp VIEW chỉ thấy tên và có thể gửi yêu cầu; quản trị học liệu không sửa được hồ sơ HCNS.",
                ]
              : repository === "marketing"
                ? [
                    "Bối cảnh giả lập: chiến dịch UAT giới thiệu một lớp học mẫu, không phải kế hoạch kinh doanh hoặc cam kết ngân sách thật.",
                    `Hạng mục: ${title}. Nhóm Marketing phân công nội dung, người kiểm tra và thời điểm đề xuất đăng tải.`,
                    "Các bước mẫu: nhận brief → chuẩn bị nội dung → rà soát thông điệp → gửi duyệt → xuất bản theo quyền được giao → ghi nhận phản hồi.",
                    "Tiêu chí dùng thử: quản lý kho Marketing cập nhật tài liệu trong phạm vi của mình; không thay đổi hồ sơ HCNS; việc chia sẻ cho người ngoài phòng vẫn cần cấp quyền cụ thể.",
                  ]
                : [
                    "Bối cảnh giả lập: Công ty Mẫu tổ chức kho tài liệu dùng chung để nhân viên thực hành tìm kiếm và tra cứu. Nội dung không thay thế quy định thật của doanh nghiệp.",
                    `Nội dung quy trình: ${title}. Nhân viên kiểm tra tài liệu hiện hành trước khi thực hiện công việc.`,
                    "Các bước mẫu: xác định nhu cầu → đọc hướng dẫn → chuẩn bị biểu mẫu → chuyển người phụ trách → nhận kết quả và lưu lại thông tin bàn giao.",
                    "Tiêu chí dùng thử: nhân viên mở được tài liệu công ty đã được cấp, lưu tài liệu yêu thích và xem lại trong lịch sử; các thao tác quản trị chỉ dành cho người có quyền.",
                  ];
        const scenario = deleted
          ? "Thùng rác / phục hồi"
          : expired
            ? "Đã hết hiệu lực"
            : scheduled
              ? "Chưa đến ngày hiệu lực"
              : pending
                ? "Chờ phê duyệt"
                : publication === "DRAFT"
                  ? "Bản nháp"
                  : index === 1
                    ? "Chỉ xem, không tải"
                    : isPublic
                      ? "Công khai"
                      : versioned
                        ? "Có lịch sử phiên bản"
                        : "Riêng tư theo quyền";
        const content = `${title}\n\n${warning}\nMã tài liệu: ${id}\nTình huống: ${scenario}\n\n${sections.join("\n\n")}\n\nBài thực hành dùng thử\n1. Tìm tài liệu này bằng một từ trong tiêu đề.\n2. Mở bản xem và kiểm tra quyền xem/tải.\n3. Ghi kết quả vào phiếu phản hồi; nếu khác mong đợi, lưu tên tài liệu và vai trò đang sử dụng.\n\nKết quả mong đợi\nKhách hàng có watermark khi xem và tải PDF. Tài khoản nội bộ không có watermark. Quyền tải phụ thuộc cả ACL và chính sách riêng của file.\n\n${warning}`;
        return {
          id,
          title,
          folderId: `uat-${slug}`,
          folderName,
          repository,
          parent,
          publication,
          access: isPublic ? "PUBLIC" : "PRIVATE",
          downloadable: index !== 1,
          deleted,
          expired,
          scheduled,
          versioned,
          pending,
          scenario,
          level: level ? `HSK ${level}` : null,
          effective_from: scheduled ? at(30) : null,
          effective_until: expired ? at(-7) : null,
          content,
        };
      }),
  );
}
