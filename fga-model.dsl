model
  schema 1.1

type user

type partner
  relations
    define can_admin: [user]
    define can_manage_members: [user]
    define can_view: [user]
    define partner_admin: [user]
    define partner_user: [user]
    define partner_viewer: [user]
    define cr_admin: [user]
    define cr_super_admin: [user]

  permissions
    define view = can_admin or can_manage_members or can_view or partner_admin or partner_user or partner_viewer or cr_admin or cr_super_admin
    define manage = can_admin or can_manage_members or partner_admin or cr_admin or cr_super_admin

type game
  relations
    define owner: [partner]

  permissions
    define view = owner from partner
    define manage = owner from partner

type sku
  relations
    define supplier: [partner]

  permissions
    define view = supplier from partner
    define manage = supplier from partner

type platform
  relations
    define super_admin: [user]

  permissions
    define view_all = super_admin
    define manage_all = super_admin
    define manage_cr_admins = super_admin 