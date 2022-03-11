<div align="center">
<h1>Select Admin</h1>
Fast build tool for admin/backoffice by YAML declarative way.
<br >
<img src="https://blog.selectfromuser.com/content/images/2022/03/Screen-Shot-2022-03-11-at-6.09.23-PM.png" class="kg-image" alt="" loading="lazy" width="1394" height="778" srcset="https://blog.selectfromuser.com/content/images/size/w600/2022/03/Screen-Shot-2022-03-11-at-6.09.23-PM.png 600w, https://blog.selectfromuser.com/content/images/size/w1000/2022/03/Screen-Shot-2022-03-11-at-6.09.23-PM.png 1000w, https://blog.selectfromuser.com/content/images/2022/03/Screen-Shot-2022-03-11-at-6.09.23-PM.png 1394w" sizes="(min-width: 720px) 720px">
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

#### ko-KR

- [개발자 문서](https://docs.selectfromuser.com/guide/)
- [Official Website 공식웹사이트](https://www.selectfromuser.com/)
- [UI Components 컴포넌트](https://app.selectfromuser.com/components)
- [업데이트 내역](https://www.selectfromuser.com/changelog)

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

## Support

해당 프로젝트는 2020년부터 현재 2022년까지 Free/Team/Enterprise Plan 제공을 위해 개발팀이 계속 기능추가, 유지보수, 보안패치, 문서화를 하고 있습니다.

[라이센스](https://github.com/eces/select/blob/main/LICENSE.md)에 따라 무료로 이용가능하며, 그 외에 유료플랜 가입이나 기술지원을 원하신다면 해당 페이지로 문의바랍니다. https://www.selectfromuser.com/pricing 