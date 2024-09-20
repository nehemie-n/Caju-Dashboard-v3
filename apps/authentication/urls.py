from django.urls import path
from django.shortcuts import redirect
from . import views

urlpatterns = [
    path(
        "", lambda request: redirect("dashboard/public", permanent=False), name="index"
    ),
    path("login/", views.signin, name="login"),
    path("logout/", views.signout, name="logout"),
    path("forgot_password/", views.forgot_password, name="forgot_password"),
    path(
        "password_reset_confirm/<uidb64>/<token>/",
        views.password_reset_confirm,
        name="password_reset_confirm",
    ),
    path("activate/<uidb64>/<token>/", views.activate, name="activate"),

    path("user_list/", views.user_list, name="user_list"),
    
    path("modify_user/<int:id>/", views.modify_user, name="modify_user"),
    path("register_user/", views.admin_register_user, name="register_user"),
    
    path(
        "activate_deactivate_user/<int:id>",
        views.activate_deactivate_user,
        name="activate_deactivate_user",
    ),

    # Paths to deal with access request
    path("request_access/", views.request_access, name="request_access"),
    path("access_requests/", views.access_requests, name="access_requests"),
    path("access_requests/<int:id>/", views.view_access_request, name="access_request_view"),
    
]
