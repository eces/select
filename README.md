<div align="center">
<h1>Select Admin</h1>
<p style="margin-bottom: 1rem">Fast build tool for admin/backoffice by YAML declarative way.</p>

<div style="display: flex; justify-content: center">
  <a href="https://www.npmjs.com/package/selectfromuser" target="_blank" style="margin: 0.25rem"><img src="https://img.shields.io/npm/v/selectfromuser" /></a>
  <a href="https://www.npmjs.com/package/selectfromuser" target="_blank" style="margin: 0.25rem"><img src="https://img.shields.io/npm/dm/selectfromuser" /></a>
  <a href="https://github.com/eces/select" target="_blank" style="margin: 0.25rem"><img src="https://img.shields.io/github/last-commit/eces/select" /></a>
</div>
<img src="https://blog.selectfromuser.com/content/images/2022/03/Screen-Shot-2022-03-11-at-6.09.23-PM.png" alt="" loading="lazy" width="720" srcset="https://blog.selectfromuser.com/content/images/size/w600/2022/03/Screen-Shot-2022-03-11-at-6.09.23-PM.png 600w, https://blog.selectfromuser.com/content/images/size/w1000/2022/03/Screen-Shot-2022-03-11-at-6.09.23-PM.png 1000w, https://blog.selectfromuser.com/content/images/2022/03/Screen-Shot-2022-03-11-at-6.09.23-PM.png 1394w" sizes="(min-width: 720px) 720px">
</div>

<p>운영 툴을 채우는 새로운 방법</p>
<p>어드민 페이지를 만들고 배포하고 관리하기에는 어렵고 SQL 쿼리와 API를 매번 만들면 시간이 계속 늘어납니다. 다른 방법은 없을까요?</p>
<p>최소 비용으로 빠른 기간내 팀 협업을 성공. 고객조회, 매출분석, 지표통계, 컨텐츠관리, 이력조회를 가입 후 3일 안에 해결하고 있습니다.</p>
<p>더 이상 DB, API 클라이언트에 의존하지 않아도 돼요.</p>
<span style="background-color: rgb(221, 244, 255); color: rgb(9, 105, 218); padding: 0.5rem; border-radius: 1rem;">설치형(로컬 실행 가능한) 오픈소스 업데이트를 준비중입니다! 조금만 기다려주세요.</span>

<br />

## Features

- [x] [mysql](#) backend support.
- [x] [RESTful HTTP API](#) backend support.
- [x] [pgsql](#) backend support. (partially suported not tested yet)
- [ ] [mssql](#) backend support. (partially suported not tested yet)
- [ ] [redis](#) backend support.
- [x] [Google Spreadsheet](#) backend support.
- [x] User management.
- [ ] Permission and access control with roles.
- [x] Customizable menus, groups and tabs.
- [x] Mulitple pages with URL to share.
- [x] Table UI
- [x] Local sort, pagination
- [ ] Server-side pagination
- [x] Query block type
- [x] Modal(popup) block type
- [x] Markdown block type
- [x] Block-wide parameters
- [x] Page-wide parameters
- [x] Share and open saved search.
- [ ] SSH tunneling

## Usage

Install package from `npm install -g selectfromuser` or `yarn global add selectfromuser`.



## Documentation

#### ko-KR

- [Documentation 개발자 문서](https://docs.selectfromuser.com/docs)
- [Official Website 공식웹사이트](https://www.selectfromuser.com/)
- [UI Components 컴포넌트](https://www.selectfromuser.com/components)
- [Changelog 업데이트 내역](https://docs.selectfromuser.com/changelog)

### Sample Recipe

`default.yml`

```yml
select-configuration:
  title: Welcome to Select
  menus:
    - group: 회원
      name: 고객 관리
      path: users
      placement: menu-only
      redirect: users/active
    
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

    - group: 기타메뉴
      name: 클라우드 이용
      path: https://selectfromuser.com
      target: _blank

  access-control:
    
  users:
    - id: admin
      pw: YWRtaW4=
      roles:
  
  integrations:
    google-sso:
      enabled: false
      restrict-domain: 
    google-spreadsheets:
      restrict-domain: 
  
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
        
  resources:
    # - key: mysql
    #   type: mysql
    #   host: YOUR_HOST.ap-northeast-2.rds.amazonaws.com
    #   port: 3306
    #   username: (계정이름)
    #   password: (base64 인코딩된 계정 비밀번호)
    #   database: (데이터베이스이름)
    #   timezone: '+00:00'
    #   extra:
    #     charset: utf8mb4_general_ci

redis:
  master:
    host: 127.0.0.1
    port: 6379
    db: 0

web: 
  base_url: http://localhost:9400

secret:
  access_token: SECRET

policy:
  session_expire: 48300

google:
  client_id: 
  redirect_uri: 
  client_secret: 

google_sheet:
  client_id: 
  redirect_uri: 
  client_secret: 
```


## Tests

##### `npm test -- --grep="auth"`

##### `npm test -- --grep="block"`

##### `npm test -- --grep="config"`

## Support

해당 프로젝트는 2020년부터 현재 2022년까지 Free/Team/Enterprise Plan 제공을 위해 개발팀이 계속 기능추가, 유지보수, 보안패치, 문서화를 하고 있습니다.

직접 설치하여 비용없이 무료이용 가능합니다. 그외에 정책은 [라이센스](https://github.com/eces/select/blob/main/LICENSE)를 따릅니다. 기능제안, 기술지원은 해당 페이지로 문의바랍니다. https://www.selectfromuser.com
