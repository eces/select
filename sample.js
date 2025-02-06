/**
 * @license
 * Copyright(c) 2021-2023 Selectfromuser Inc.
 * All rights reserved.
 * https://www.selectfromuser.com
 * {team, support, jhlee}@selectfromuser.com, eces92@gmail.com
 * Commercial Licensed. Grant use for paid permitted user only.
 */

module.exports['index.yml'] = `
title: 셀렉트어드민

# layout:
#   style:
#     backgroundColor: "#19234B !important"

menus:
- group: 회원
  name: 고객 관리
  path: users
  placement: menu-only
  redirect: users/active
  icon: mdi-account
  
  menus:
  - name: 결제 관리
    path: payments
    placement: menu-only
    icon: mdi-timeline-check

- group: 회원
  name: 최근가입자 목록
  path: users/active
  placement: tab-only

- group: 회원
  name: 휴면회원 목록
  path: users/dormant
  placement: tab-only

- group: 회원
  name: 마케팅 수신동의
  path: users/promotion
  placement: tab-only

- group: 기타메뉴
  name: 공식 문서 
  path: https://docs.selectfromuser.com
  target: _blank
  icon: mdi-book-open-variant
  iconEnd: 링크

- group: 기타메뉴
  name: 클라우드 이용
  path: https://app.selectfromuser.com
  target: _blank
  icon: mdi-tab
  iconEnd: 링크

# resources:
# - name: mysql.dev
#   mode: local
#   type: mysql
#   host: aaaa.ap-northeast-2.rds.amazonaws.com
#   port: 3306
#   username: user_aaaa
#   password: aaaa
#   database: aaaa
#   timezone: '+00:00'
#   extra:
#     charset: utf8mb4_general_ci

# pages:
# - path: healthcheck/db
#   blocks:
#   - type: query
#     resource: mysql.dev
#     sql: SELECT NOW()
`

module.exports['dashboard.yml'] = `
pages:
- 
  id: dashboard
  path: dashboard
  layout: dashboard
  style:
    background-color: "#f4f5f8"

  title: 사용자 현황
  # subtitle: 대시보드
        
  blocks:
  - type: left
    layout: dashboard
    style:
      width: 400px
    blocks:
    - type: http
      name: 1
      axios:
        method: GET
        url: ${global.__API_BASE}/sample-api/dashboard/users
      rowsPath: rows
      display: metric
      width: 100%
      showDownload: csv

    - type: http
      axios:
        method: GET
        url: ${global.__API_BASE}/sample-api/dashboard/revenue
      rowsPath: rows
      display: metric
      width: 100%
      style:
        color: RoyalBlue
      showDownload: false



    - type: http
      axios:
        method: GET
        url: ${global.__API_BASE}/sample-api/dashboard/rank
      rowsPath: rows

      name: category
      display: metric
      width: 100%
      
      metricOptions:
        type: category
        names: 
          - 활성
          - 비활성
        value: c
        total: 최근가입자
      showDownload: false

    - type: http
      axios:
        method: GET
        url: ${global.__API_BASE}/sample-api/dashboard/stores
      rowsPath: rows
      name: 신규 가입 업체
      width: 100%
      height: calc(50vh - 150px)
      style:
        overflow: auto
      
      display: card
      showDownload: false
    
  - type: center
    layout: dashboard
    style:
      width: 50%
      border: 0
    blocks:
    - type: http
      axios:
        method: GET
        url: ${global.__API_BASE}/sample-api/dashboard/orders
      rowsPath: rows
      name: 최근 방문자
      width: 100%
      height: calc(100vh - 200px)
      chartOptions:
        backgroundColor:
          - "#0D6EFD"
        borderWidth:
          - 0
        style:
          # minWidth: 500px
        type: bar
        x: x
        y: y
        label: 일간 로그인
        options:
          layout:
            padding: 10
        interval: day
        gap: true
      showDownload: csv
  
`

module.exports['users/index.yml'] = `
pages:
- path: users/active
  blocks: 
  - type: markdown
    content: >
      ## 7일 가입자 조회
    
- path: users/dormant
  blocks:
  - type: markdown
    content: >
      ## 휴면회원 조회
    
- path: users/promotion
  blocks:
  - type: markdown
    content: >
      ## 동의/미동의 조회
`

module.exports['users/payment.yml'] = `
pages:
- path: payments
  title: 결제 및 환불
  blocks:
  - type: markdown
    content: |
      > 최근 7일 대상자 목록
  
  # - type: query
  #   name: Data from Query
  #   resource: mysql.dev
  #   sql: |
  #     SELECT * 
  #     FROM chat 
  #     ORDER BY id DESC
  #     LIMIT 3
  #   tableOptions:
  #     cell: true

  - type: http
    axios:
      method: GET
      url: https://api.selectfromuser.com/sample-api/users
    rowsPath: rows
    columns:
      name:
        label: Name
      age:
        label: Engagement Point

    showDownload: csv

    viewModal:
      useColumn: id
      # mode: side
      blocks:
      - type: http
        axios:
          method: GET
          url: https://api.selectfromuser.com/sample-api/users/{{user_id}}
        rowsPath: rows
        
        params:
        - key: user_id
          valueFromRow: id

        display: col-2
        title: "ID: {{id}}"
        showSubmitButton: false
        

        tabOptions:
          autoload: 1
          tabs:
          - name: 최근거래내역
            blocks: 
            - type: markdown
              content: 거래내역 내용
          - name: 프로모션참여
            blocks: 
            - type: markdown
              content: 프로모션 내용
`

module.exports['reference.yml'] = `
menus:
- path: PlVvFU
  name: Reference 샘플
  redirect: PlVvFU/reference
  icon: mdi-lightbulb-on-outline

- path: PlVvFU/reference
  name: Guide
  group: reference
  placement: tab-only

- path: PlVvFU/columns
  name: Columns
  group: reference
  placement: tab-only

- path: PlVvFU/params
  name: Params
  group: reference
  placement: tab-only

- path: PlVvFU/display
  name: Display
  group: reference
  placement: tab-only

- path: PlVvFU/actions
  name: Actions
  group: reference
  placement: tab-only

- path: PlVvFU/type
  name: Type
  group: reference
  placement: tab-only

- path: PlVvFU/layout
  name: Layout
  group: reference
  placement: tab-only  

- path: PlVvFU/dashboard
  name: Dashboard
  group: reference
  placement: tab-only

- path: PlVvFU/transformation
  name: Transformation
  group: reference
  placement: tab-only

- path: PlVvFU/api
  name: API
  group: reference
  placement: tab-only

pages:
- path: PlVvFU/reference
  # class: conatiner
  blocks:
  - type: markdown
    content: |
      ## 안내사항
      다양한 기능과 컴포넌트를 간단한 샘플과 함께 살펴보실 수 있습니다.

      비슷한 자료는 아래에서 더 확인하실 수 있습니다.      

      |구분|링크|
      |------|---|
      |가이드 문서|https://docs.selectfromuser.com/|
      |쇼룸|https://showroom.selectfromuser.com/|
      |업데이트|https://blog.selectfromuser.com/tag/update/|

      도움이 필요하시다면 이메일, 커뮤니티, 슬랙, 채팅 등으로 문의해주세요.

      |구분|링크|
      |------|---|
      |이메일|support@selectfromuser.com|
      |커뮤니티|https://ask.selectfromuser.com/|
      |슬랙|https://bit.ly/3CxsQSt|

- path: PlVvFU/columns
  title: Columns sample
  blocks:
  - type: query
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 
        1 as id, 
        '상품A' as name,
        '상품 설명1' as description,
        50000 as price, 
        'ACTIVE' as status, 
        'https://images.unsplash.com/photo-1464278533981-50106e6176b1?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' as image_url, 
        NOW() as created_at,
        'tag1,tag2,tag3' as tags,
        '관리자' as user_type,
        '대기' as state,
        JSON_OBJECT('key1', 'value1', 'key2', 'value2') as json_data,
        '010-1234-5678' as phone,
        '기본 메모' as memo,
        'https://google.com/' as url

        UNION

      SELECT 
        2 as id, 
        '상품B' as name, 
        '상품 설명2' as description,
        100000 as price, 
        'ACTIVE' as status, 
        'https://images.unsplash.com/photo-1464278533981-50106e6176b1?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' as image_url, 
        NOW() as created_at,
        'tag1,tag2,tag3' as tags,
        '사용자' as user_type,
        '완료' as state,
        JSON_OBJECT('key1', 'value1', 'key2', 'value2') as json_data,
        '010-1234-5678' as phone,
        '' as memo,
        '' as url

    searchOptions:
      enabled: true
    
    paginationOptions:
      enabled: true
      perPage: 10
    
    showRefresh: true
    showDownload: csv formatted xlsx

    columns:
      id:
        label: 번호
        copy: true
        sticky: true
        prepend: true
        hidden: false
        filterOptions:
          enabled: true
          placeholder: '0000'

      name:
        label: 상품명
        color:
          상품A: blue
        buttons:
          - label: 상세보기
            openModal: product-detail-:id
          - label: 링크 열기
            openUrl: https://unsplash.com/ko/s/%EC%82%AC%EC%A7%84/{{name}}?license=free
        subtitle: description
        searchOptions:
          enabled: true

      description:
        hidden: true

      price:
        label: 가격
        formatFn:
          - number0
          - ""
          - " 원"          
        color:
          50000: green

      status:
        label: 상태
        format: toggle
        trueValue: ACTIVE
        falseValue: INACTIVE
        updateOptions:
          type: query
          resource: mysql.sample
          sqlType: update
          sql: SELECT 1
          confirm: true

      image_url:
        label: 이미지
        format: image
        thumbnail: true
        thumbnailWidth: 100px

      created_at:
        label: 등록일
        formatFn: datetimeA
        sortable: false

      tags:
        label: 태그
        formatFn: splitComma

      user_type:
        label: 사용자 유형
        valueAs:
          관리자: 최상위 관리자
          사용자: 일반 사용자

      state:
        label: 상태
        color:
          대기: yellow
          완료: green
          취소: red

      json_data:
        label: JSON 데이터
        format: table
        # format: json

      phone:
        label: 연락처
        formatFn: maskCenter4
        copy: true
      
      memo:
        label: 메모
        formatFn: |
          return value ? value : '없음'        

      url:
        label: 웹사이트
        format: url

    viewModal:
      useColumn: id
      header: false      
      width: 400px
      height: 300px
      blocks:
        - type: query
          resource: mysql.sample
          sqlType: select
          sql: SELECT 1000 as test
          showDownload: false
          display: col-1
    
    modals:
      - path: product-detail-:id
        header: false
        blocks:
          - type: query
            resource: mysql.sample
            sqlType: select
            sql: SELECT 1 as field
            display: card
            params:
              - key: id
                defaultValueFromRow: id
                hidden: false

- path: PlVvFU/params
  title: Params sample
  class: container
  # style: 
  #   maxWidth: 800px
  blocks:

  - type: query
    resource: mysql.sample
    sqlType: insert
    sql: SELECT 1

    display: form
    formOptions:
      firstLabelWidth: 100px
      labelWidth: 100px
      width: 400px 
    
    params:
    - key: name
      label: 이름
      required: true
      minlength: 2
      maxlength: 10
      help: 2~10자

    - key: email
      label: 이메일
      # format: text
      placeholder: example@email.com
      validateFn: |
        const email = params.find(e => e.key == 'email')
        
        if (!email.value || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.value)) {
          return '올바른 이메일 형식이 아닙니다'
        } else {
          return ''
        }

    - key: phone
      label: 연락처
      format: text
      placeholder: 010-0000-0000

  - type: query
    resource: mysql.sample
    sqlType: insert
    sql: SELECT 1

    display: form inline
    formOptions:
      firstLabelWidth: 100px
      labelWidth: 100px
      width: 400px 

    params:
    - key: select
      label: 선택
      dropdown:
      - pinned: 고정
      - event: 이벤트
      - ad: 광고
      dropdownSize: 3
      dropdownMultiple: true

    - key: select2
      label: 선택2
      selectOptions:
        enabled: true
      multiple: true
      taggable: true
      pushTags: true
      dropdown:
        - 호텔
        - 리조트
        - 캠핑
        - 독채
        - 수영장      

    - key: code
      label: 코드
      # datalist:
      # - value: A000
      #   label: 분류1
      # - value: A002
      #   label: 분류2
      datalist: true
      datalistFromQuery:
        type: query
        resource: mysql.sample
        sqlType: select
        sql: SELECT id AS value, name AS label FROM users
      datalistPreview: true

  - type: query
    resource: mysql.sample
    sqlType: insert
    sql: SELECT 1
    formOptions:
      display: col
    
    params:
    - key: period
      label: 기간
      format: date
      range: true   
      shortcuts:
        - label: 최근 1년
          from:
            offset: -1
            period: year
          to:
            offset: 0
            period: year
        - label: 최근 6개월
          from:
            offset: -6
            period: month
          to:
            offset: 0
            period: month
        - label: 최근 3개월
          from:
            offset: -3
            period: month
          to:
            offset: 0
            period: month
        - label: 이번달
          from:
            startOf: month
          to:
            endOf: month
        - label: 지난달
          from:
            offset: -1
            startOf: month
            period: month
          to:
            offset: -1
            endOf: month
            period: month
      disabledDate: |
        return date >= new Date()

    - key: working_time
      label: 근무 시간
      format: time
      timeOptions:
        start: 09:00
        end: 18:00
        step: 00:30
        format: HH:mm

    - key: color_preference
      label: 색상 선호도
      format: color

    - key: address
      label: 주소
      format: address
      updateParams:
        road_address: roadAddress
        postcode: zonecode
        longitude: x
        latitude: y

    - key: description
      label: 자기소개
      format: editor
      width: 500px

    - key: status
      label: 상태
      radio:
        - draft: 초안
        - published: 발행
      defaultValue: draft
      # radioButtonGroup: true  

    - key: amount
      label: 금액
      format: number

    - key: vintage
      label: 연도 선택
      format: range
      min: 2000
      max: 2024
      step: 1

    - key: file_upload
      label: 파일 업로드
      format: s3
      multiple: true
      max: 3
      accept: image/*

    - key: sheet_data
      label: 엑셀 업로드
      format: sheet
      sheetOptions:
        convertDate: 
          - 시작일
          - 종료일
      accept: .xlsx

    - key: tiptap_content
      label: 고급 에디터
      format: tiptap
      width: 800px

    - key: display_json
      label: 리스트박스
      format: listbox
      multiple: true
      listStyle:
        minWidth: 300px
        height: 300px
        overflow: scroll
      datalistFromQuery: 
        type: query
        resource: mysql.sample
        sql: SELECT DISTINCT id AS value, store_name AS label, receipt_no FROM receiptStoreList
      template: |
        {{value}} 
        <span class="text-xs font-bold bg-slate-400 text-white px-1 rounded">{{receipt_no}}</span>

    submitButton:
      label: 제출
      type: primary

    resetButton:
      label: 초기화
      type: light

    reloadAfterSubmit: true

- path: PlVvFU/display
  class: container
  blocks:
  - type: query
    title: 1. Form Display
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 1 as id, 'John Doe' as name, 
             'john@example.com' as email,
             '2024-01-01' as created_at
    display: form
    columns:
      id:
        label: ID
      name:
        label: 이름
      email:
        label: 이메일
      created_at:
        label: 가입일
        format: date

  - type: query
    title: 2. Form Inline Display
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 1 as id, 'John Doe' as name, 
             'Active' as status
    display: form inline
    columns:
      id:
        label: ID
      name:
        label: 이름
      status:
        label: 상태

  - type: query
    title: 3. Column Layout Displays
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 
        'Basic Info' as category,
        'John Doe' as name,
        '30' as age,
        'New York' as location
    display: col-2
    thStyle:
      width: 150px

  - type: query
    title: 4. Post Display
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 
        'Important Update' as title,
        'This is a sample post content.' as content
    display: post
    columns:
      title:
        tdClass: text-lg font-bold
      content:
        tdClass: p-4

  - type: query
    title: 5. Card Display
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 1 as id, 
             'Product A' as name,
             'Description of Product A' as description
    display: card

  - type: query
    title: 6. Metric Display
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 
        'Sales' as category,
        1000 as value,
        'Monthly Sales Report' as label
    display: metric
    metricOptions:
      type: category
      names: 
        - Monthly Sales
      value: value
      total: Total Sales

  - type: query
    title: 7. Calendar Display
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 
        DATE_FORMAT(NOW(), '%Y-%m-%d') as date,
        'Meeting' as event,
        10 as count
    params:
      - key: calendar
        range: true
        valueFromCalendar: true    
    display: calendar
    cache: true
    columns:
      count:
        label: 일정수
        color: blue-600
        openModal: date-modal
    modals:
      - path: date-modal
        blocks:
          - type: markdown 
            content: |
              날짜값 클릭하여 모달 띄우기

  - type: query
    title: 8. Timeline Display
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 
        NOW() as created_at,
        'System Update' as event,
        'Admin' as user_name
    display: timeline
    timelineOptions:
      useColumn: created_at
      template: |
        <b>{{user_name}}</b>님이 {{event}} 작업을 진행했습니다.

  - type: query
    title: 9. HTML Table Display
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 
        1 as id,
        'Product A' as name,
        100 as stock,
        50000 as price
    display: html table
    thead:
      rows:
        - class: bg-neutral-100 text-neutral-800 font-medium divide-x
          cells:
            - th: { content: "ID" }
            - th: { content: "상품명" }
            - th: { content: "재고" }
            - th: { content: "가격" }
    tbody:
      rows:
        - class: text-center divide-x hover:bg-neutral-100
          cells:
            - td: { content: "{{id}}" }
            - td: { content: "{{name}}" }
            - td: { content: "{{stock}}" }
            - td: { content: "{{price}}" }
    tfoot:
      rows:
        - class: font-medium divide-x text-center
          cells:
            - th: { colspan: 2, content: "합계" }
            - td: { content: "{{total_stock}}" }
            - td: { content: "{{total_price}} 원" }
    totalFn: |
      total.total_stock = _.sumBy(rows, 'stock')
      total.total_price = _.sumBy(rows, 'price')

  - type: query
    title: 10. Map Display (네이버 지도)
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 
        37.5665 as latitude,
        126.9780 as longitude,
        'Seoul Office' as name,
        'Main Office Location' as description
    display: map
    displayFn: |
      for (const row of rows) {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(row.latitude, row.longitude),
          title: row.name,
          map: map,
        });

        const infowindow = new naver.maps.InfoWindow({
          content: \`
            <div class="p-3">
              <h3>\${row.name}</h3>
              <p>\${row.description}</p>
            </div>
          \`
        });

        naver.maps.Event.addListener(marker, 'click', function() {
          if (infowindow.getMap()) {
            infowindow.close();
          } else {
            infowindow.open(map, marker);
          }
        });
      }
      
      map.setCenter(new naver.maps.LatLng(rows[0].latitude, rows[0].longitude));
    height: 400px
    width: 100%
    mapOptions:
      zoom: 15
      zoomControl: true

- path: PlVvFU/actions
  class: container
  title: Actions sample
  blocks:
  - type: query
    resource: mysql.sample
    sqlType: select
    sql: >
      SELECT 1 AS id, 'Sample Data' AS name
      UNION
      SELECT 2 AS id, 'Hello world' AS name
    showDownload: false
    columns:
      name:
        buttons:
          - label: check
            visible: "{{ row.name == 'Hello world' }}"
            openAction: anything
    selectOptions: 
      enabled: true
      selectOnCheckboxOnly: true
    actions:
      - label: 단일 쿼리 실행
        type: query
        resource: mysql.sample
        sqlType: update
        sql: UPDATE test SET status = 'active' WHERE id = :id
        single: true
        placement: right top
        button:
          type: primary
          icon: check-circle

      - label: API 호출
        name: anything
        type: http
        axios:
          method: POST
          url: https://httpbin.selectfromuser.com/anything
          data:
            id: "{{id}}"
        params:
          - key: id
            valueFromSelectedRows: id
        placement: right bottom
        button:
          type: success-light

      - label: 페이지 이동
        openUrl: https://www.selectfromuser.com
        single: true
        target: _blank
        placement: left top
        button:
          type: default
          icon: link-variant

      - label: 모달 열기
        single: true
        openModal: sample-modal
        placement: left bottom
        button:
          type: warning-light
          icon: information

      - label: 빠른 정보 보기
        openPopper: true
        forEach: true
        popperOptions:
          placement: right
        popperStyle:
          width: 300px
          padding: 15px
        blocks:
          - type: markdown
            content: |
              ### 상세 정보
              - ID: {{id}}
              - 이름: {{name}}

      - label: CSV 다운로드
        showDownload: csv
        single: true
        placement: top right
        button:
          type: primary-light

      - label: 삭제
        type: query
        resource: mysql.sample
        sqlType: delete
        sql: DELETE FROM test WHERE id = :id
        confirmText: 정말로 삭제하시겠습니까?
        placement: top left
        button:
          type: danger
          icon: delete

      - label: 프롬프트 입력
        type: http
        axios:
          method: POST
          url: https://httpbin.selectfromuser.com/anything
          data:
            id: "{{id}}"
        params:
          - key: id
            valueFromPrompt: true
            promptText: 정보를 입력해주세요.

    modals:
    - path: sample-modal
      # blocks:
      # - type: markdown
      #   content: |
      #     ### 샘플 모달
      #     선택된 데이터의 추가 정보를 표시합니다.
      usePage: usepage-modal

- path: usepage-modal
  blocks:
  - type: markdown
    content: |
      ### 샘플 모달
      선택된 데이터의 추가 정보를 표시합니다. (usePage)

- path: PlVvFU/type
  blocks:
  - type: header
    items:
    - path: PlVvFU/layout
      label: 레이아웃
      icon: home
    - label: 옵션

  - type: tab
    tabOptions:
      autoload: 1
      type: plain
      tabs:
      - name: 사용자
        blocks:
        - type: markdown
          content: 내용 입력 가능1
      - name: 리소스
        blocks:
        - type: markdown
          content: 내용 입력 가능2
      - name: 최근 수정내역
        blocks:
        - type: markdown
          content: 내용 입력 가능3
      - name: 기타 신규
        blocks:
        - type: markdown
          content: 내용 입력 가능
        - type: tab
          tabOptions:
            autoload: 1
            type: button
            tabs:
            - name: 잔고1
              blocks:
              - type: markdown
                content: 내용 입력 가능 a
            - name: 잔고2
              blocks:
              - type: markdown
                content: 내용 입력 가능 b
            - name: 잔고3
              blocks:
              - type: markdown
                content: |
                  내용 입력 가능 c

                  <span style="font-size: 5em">👨‍👩‍👧‍👦</span>    

  - type: toggle
    name: toggle sample
    icon: tree
    class: text-lg p-2 shadow rounded text-green-700
    toggledClass: font-medium text-green-700 bg-green-600/10
    # toggled: true
    blocks:
      - type: markdown
        content: |
          토글(toggle) 타입 블록을 통해 내용을 접었다 펼칠 수 있습니다.

  - type: iframe
    src: https://www.selectfromuser.com/
    style:
      width: 50%
      minWidth: 550px
      height: 80vh

- path: PlVvFU/layout
  layout: 
    style:
      # max-width: 1200px
      margin: 0px auto
    class: flex flex-wrap # gap-3
    div:
      - name: page1
        style:
          width: 100%
        class: bg-amber-100

      - name: page2-1
        style: 
          overflow: auto
          height: 300px
        class: drop-shadow-lg border border-slate-700 bg-white grow
      - name: page2-2
        style: 
          width: 300px
        class: bg-sky-100

      - name: page3
        style:
          width: 100%
          background-color: purple !important
          outline: 1px solid red
          color: #fff
        class: bg-indigo-100 
    
  blocks:
  - type: http
    layout: page1
    axios:
      method: GET
      url: https://gist.githubusercontent.com/eces/c267436ddeec8917b47ee666b0d5e955/raw/892877e7035c4f61e946848a3f6da7e9983cab15/test.json
    rowsPath: rows    

  - type: markdown
    layout: page2-1
    content: |
      # Row
      - row1
      # Row
      - row2
      # Row
      - row3
      # Row
      - row4
      # Row
      - row5

  - type: http
    layout: page2-2
    axios:
      method: GET
      url: https://gist.githubusercontent.com/eces/c267436ddeec8917b47ee666b0d5e955/raw/892877e7035c4f61e946848a3f6da7e9983cab15/test.json
    rowsPath: rows
    tableOptions:
      cell: true

  - type: http
    layout: page3
    axios:
      method: GET
      url: https://gist.githubusercontent.com/eces/c267436ddeec8917b47ee666b0d5e955/raw/892877e7035c4f61e946848a3f6da7e9983cab15/test.json
    rowsPath: rows
        
  - type: toggle
    name: Simple layout
    blocks:
    - 
      type: top
      title: title
      blocks:
        - type: markdown
          content: >
            > TOP
    - 
      type: left
      title: title
      subtitle: subtitle
      blocks:
        - type: markdown
          content: >
            > LEFT
    - 
      type: center
      style:
        width: 50%
        height: 80vh
        maxHeight: calc(100vh - 300px)
        overflow: scroll
      blocks:
        - type: markdown
          content: >
            > CENTER
        - type: query
          title: 내역은 최근 30일
          subtitle: 내역은 최근 30일
          description: 영수증 목록
          resource: mysql.sample
          sql: SELECT * FROM receiptStoreList LIMIT 300
          sqlType: select
    - 
      type: right
      blocks:
        - type: markdown
          content: >
            > RIGHT
    - 
      type: bottom
      blocks:
        - type: markdown
          content: >
            > BOTTOM

- path: PlVvFU/dashboard
  # id: dashboard
  layout: dashboard
  style:
    background-color: "#f4f5f8"
    margin-top: 100px

  title: 사용자 현황
  # subtitle: 대시보드
        
  blocks:
  - type: left
    layout: dashboard
    style:
      width: 400px
    blocks:
    - type: http
      name: 1
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/dashboard/users
      rowsPath: rows
      display: metric
      width: 100%
      showDownload: csv

    - type: http
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/dashboard/revenue
      rowsPath: rows
      display: metric
      width: 100%
      style:
        color: RoyalBlue
      showDownload: false

    - type: http
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/dashboard/rank
      rowsPath: rows

      name: category
      display: metric
      width: 100%
      
      metricOptions:
        type: category
        names: 
          - 활성
          - 비활성
        value: c
        total: 최근가입자
      showDownload: false

    - type: http
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/dashboard/stores
      rowsPath: rows
      name: 신규 가입 업체
      width: 100%
      height: calc(50vh - 150px)
      style:
        overflow: auto
      
      display: card
      showDownload: false
    
  - type: center
    layout: dashboard
    style:
      width: 50%
      border: 0
    blocks:
    - type: http
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/dashboard/orders
      rowsPath: rows
      title: 최근 방문자2
      name: 최근 방문자
      width: 100%
      height: calc(100vh - 200px)
      chartOptions:
        backgroundColor:
          - "#0D6EFD"
        borderWidth:
          - 0
        style:
          # minWidth: 500px
        type: bar
        x: x
        y: y
        label: 일간 로그인
        options:
          layout:
            padding: 10
        interval: day
        gap: true
      showDownload: csv    

- path: PlVvFU/transformation
  blocks:
    - type: toggle
      toggled: true
      name: requestFn + responseFn
      blocks:
      - type: query
        resource: json+sql
        sql: SELECT NOW()
        actions: 
          - label: 테스트키 발급
            single: true
            requestFn: |
              if (localStorage.TEST_KEY) {
                throw new Error('이미 키가 있습니다.')
              }

              // params, ...blocks
              // query1.params.name.value
              // await query2.trigger()
            
            type: query
            resource: json+sql
            sql: SELECT NOW()
            
            
            toast: 발급 완료

            responseFn: |
              localStorage.TEST_KEY = 1234
              alert(\`신규 발급: \${ localStorage.TEST_KEY }\`)

              // data, rows, row, _, toast, ...blocks
              // query1.params.name.value
              // await query2.trigger()

          - label: 테스트키 삭제
            single: true
            
            
            type: query
            resource: json+sql
            sql: SELECT NOW()
            
            toast: 삭제 완료

            responseFn: |
              delete localStorage.TEST_KEY  

    - type: toggle
      name: validateFn
      blocks:
      - type: query
        resource: mysql.sample
        sqlType: insert
        sql: SELECT 1
        params:
          - key: name
            label: 영수증 번호 
            help: 418931123
            required: true
            validateFromQuery:
              type: query
              sql: >
                SELECT COUNT(id) AS count
                FROM receiptStoreList
                WHERE receipt_no = :value
              validateFn: |
                if (+validateFromQuery.count > 0) {
                  return '중복된 영수증 번호 입니다.'
                }
                return true
            validateFn: |
              if (param.value.length != 9) {
                return '영수증 번호(9자리)를 입력해주세요.'
              }
              if (!isFinite(+param.value)) {
                return '영수증 번호만 입력해주세요.'
              }
              return true

          - key: email
            label: 이메일
            validateFn: |  
              const email = String(param.value || '');
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

              if (emailRegex.test(email)) {
                return '';
              } else {
                return '유효한 이메일 주소를 입력하세요.';
              }                 
        display: form
        formOptions:
          firstLabelWidth: 120px
          labelWidth: 100px

    - type: toggle
      name: requestSubmitFn + options
      title: 여러건 추가
      subtitle: 연관된 아이템을 일괄 추가합니다.
      blocks:
      - type: query
        resource: mysql.sample
        sqlType: insert
        sql: >
          INSERT INTO wine_stock
          SET name = :name,
              vintage = :vintage,
              price = :price
        params:
          - key: name
          - key: vintage
          - key: price
        id: query_add_wine
        hidden: true
        toast: 추가했습니다.

      - type: query
        resource: mysql.sample
        sqlType: insert
        sql: >
          SELECT 1
        requestSubmitFn: |
          for (const i in form.params.vintage.value) {
            const vintage_value = form.params.vintage.value[i]

            query_add_wine.params.name.value = form.params.name.value
            query_add_wine.params.vintage.value = vintage_value
            query_add_wine.params.price.value = form.params.vintage.options.price.value[i] || null

            await query_add_wine.trigger()
          }

        id: form
        params:
          - key: name
            value: test
          - key: vintage
            value: ['2023', '2024']
            datalist: []
            selectOptions:
              enabled: true
            multiple: true
            taggable: true
            group: vintage
            label: 수입연도
            help: "*계약금액이 다른경우 하단에 입력"
            
            display: document
            # display: table
            # display: inline

            options: 
              price:
                label: 가격
                placeholder: 00,000
                prefix: 정가
                postfix: 원
                class: text-right                
                value: 
                  - 30000
                  - 30000

- path: PlVvFU/api
  blocks:
  - type: toggle
    name: HTTP GET
    blocks:
    - type: http
      title: 조회
      subtitle: HTTP GET
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/v3/stores?q={{name}}&id={{id}}
      rowsPath: rows      
      searchOptions:
        enabled: true
      paginationOptions:
        enabled: true
        perPage: 10
      params:
        - key: id
          label: 아이디
        - key: name
          label: 이름

  - type: toggle
    name: HTTP GET + Modal
    blocks:
    - type: http
      title: 연결 조회
      subtitle: HTTP GET + Modal  
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/v3/stores
      rowsPath: rows      
      
      columns:
        Category:
          color:
            F&B: yellow
            B2B: purple
        Name:
          width: 80%
          openModal: view
      modals:
        - path: view
          useColumn: id
          header: false
          # dismissible: false
          blocks:
            - type: http
              axios:
                method: GET
                url: https://api.selectfromuser.com/sample-api/v3/stores?id={{id}}
              rowsPath: rows   
              params:
              - key: id
                valueFromRow: true
              display: post

  - type: toggle
    name: HTTP POST
    title: 추가
    subtitle: HTTP POST    
    blocks:
    - type: http
      # title: 추가
      # subtitle: HTTP POST
      axios:
        method: POST
        url: https://api.selectfromuser.com/sample-api/products
        data:
          name: "{{name}}"
      params:
        - key: name
          label: 숙소이름
          # dropdown:
          #   - A
      
      submitButton: 
        label: 추가
        type: primary
        class: px-6 py-3

      toast: 추가했습니다.

  - type: toggle
    name: HTTP PUT + updateOptions
    title: 인라인 수정
    subtitle: table updateOptions
    blocks:
    - type: http
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/products
      rowsPath: rows      
      
      columns:
        id:
        name: 
          width: 80%
          updateOptions:
            type: http
            axios:
              method: PUT
              url: https://api.selectfromuser.com/sample-api/products/{{id}}
              data:
                name: "{{value}}"
            params:
              - key: id
                valueFromRow: id
            toast: 수정 완료

  - type: toggle
    name: HTTP PUT + selectOptions actions
    blocks:
    - type: http
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/products
      rowsPath: rows      
      
      columns:
        id:
        name: 
          width: 80%
      
      selectOptions:
        enabled: true

      actions:
        - label: 일괄 수정
          type: http
          axios:
            method: PUT
            url: https://api.selectfromuser.com/sample-api/products/{{id}}
            data:
              name: "{{value}}"
          params:
            - key: id
              valueFromSelectedRows: true
            - key: value
              help: 도움이 되는 텍스트를 적어요.
              label: 가게 세부문구
          forEach: true
          reloadAfterSubmit: true

          modal: true
          confirm: 일괄수정후 배너 상태가 바뀝니다. 계속하시겠습니까?    

  - type: toggle
    name: HTTP GET + Modal > PUT
    blocks:
    - type: http
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/products
      rowsPath: rows      
      searchOptions:
        enabled: true
      paginationOptions:
        enabled: true
        perPage: 10
      columns:
        name:
          width: 80%
        상세:
          append: true
          buttons:
            - label: 조회
              openModal: modal1
      modals:
      - path: modal1
        useColumn: id
        # mode: full
        mode: side
        blocks:
        - type: http
          axios:
            method: GET
            url: https://api.selectfromuser.com/sample-api/products/{{id}}
          params:
            - key: id
              valueFromRow: id
          rowsPath: rows
          display: col-1 
          columns:
            id:
            name: 
              updateOptions:
                type: http
                axios:
                  method: PUT
                  url: https://api.selectfromuser.com/sample-api/products/{{id}}
                  data:
                    name: \${{value}}
                    
  - type: toggle
    name: HTTP GET + responseFn join
    blocks:
    - type: http
      id: Stores
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/v3/stores
      rowsPath: rows
      searchOptions: 
        enabled: true
      
      columns:
        Category:
          color:
            F&B: yellow
            B2B: purple
        products:
          # format: json
          formatFn: splitComma
      
      responseFn: |
        const products = await Products.trigger()
        
        if (!products.rows) throw new Error('상품 가져오기 실패')

        console.log(products, rows)

        for (const row of rows) {
          row.products = products.rows
            .filter(e => 1000 + +e.id != +row.id)
            .map(e => e.name)
            .join(',')
        }
    
    - type: http
      id: Products
      axios:
        method: GET
        url: https://api.selectfromuser.com/sample-api/products
      hidden: true
      autoload: false
      rowsPath: rows
`