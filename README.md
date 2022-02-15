<div align="center">
<h1>Select Admin</h1>
Fast build tool for admin/backoffice by YAML declarative way.
</div>

<br />
<a href="https://www.npmjs.com/package/selectfromuser" target="_blank"><img src="https://img.shields.io/github/package-json/v/eces/select"></img></a>

## Features

- [x] [mysql](#) backend support.
- [x] [RESTful HTTP API](#) backend support.
- [ ] [pgsql](#) backend support. (partially suported not tested yet)
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

- [UI Components](https://app.selectfromuser.com/components)
- [KR 개발자 문서](https://docs.selectfromuser.com/guide/)
- [KR 업데이트 내역](https://www.selectfromuser.com/changelog)
- [KR 자주묻는질문](https://www.selectfromuser.com/faq)

### Sample Recipe

`default.yml`

```yml
select-configuration:
  title: Welcome to Select
  menus:
    - group: 회원
      name: 고객 목록
      path: users/list
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
        - admin
  
  pages:
    - path: users/list
      blocks:
        - type: markdown
          content: >
            # 셀렉트에 오신것을 환영합니다.
        
    - path: users/dormant
      blocks:
        - type: markdown
          content: >
            # 셀렉트에 오신것을 환영합니다.
        
    - path: users/promotion
      blocks:
        - type: markdown
          content: >
            # 셀렉트에 오신것을 환영합니다.
        
  resources:
    # - key: mysql.dev
    #   type: mysql
    #   host: YOUR_HOST.rds.amazonaws.com
    #   port: 3306
    #   username: (DB account name)
    #   password: (base64 encoded DB password. Encoding with click, please see this: https://docs.selectfromuser.com/guide/connection.html)
    #   database: (DB collection name)
    #   requestTimeout: 3000
    #   timezone: '+00:00'
    #   charset: "utf8mb4_general_ci"
```


## Tests

##### `npm test -- --grep="auth"`

##### `npm test -- --grep="block"`

##### `npm test -- --grep="config"`
