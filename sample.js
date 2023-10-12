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

layout:
  style:
    backgroundColor: "#19234B !important"

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