# Changelog v3.0.0

## Product

- Mengubah positioning menjadi Internal Project Management System.
- Menghapus konsep client sebagai pengguna sistem.
- Menambahkan role ADMIN, PROJECT_MANAGER, dan MEMBER.
- Menambahkan My Work sebagai pusat pekerjaan anggota.
- Menambahkan Team dan Reports.
- Membatasi Finance untuk admin.

## Project dan task

- Project manager serta anggota project memakai referensi akun internal.
- Project memiliki objective dan team assignment.
- Task memiliki description, assignee ID, priority, dan workflow status.
- Menambahkan board task drag-and-drop pada My Work dan detail project.
- Progress project dihitung dari task berstatus DONE.

## Kolaborasi

- Comment berfungsi sebagai laporan internal.
- Comment dapat dikaitkan dengan task.
- Attachment dapat dikaitkan dengan task.
- Menambahkan activity log untuk perubahan penting.

## Security

- Menambahkan pemeriksaan akses project pada server.
- Membatasi pembuatan/edit project untuk admin dan project manager terkait.
- Membatasi update task member hanya pada task yang ditugaskan.
- Menambahkan custom claim PROJECT_MANAGER.
- Menambahkan provisioning user melalui Firebase Admin Auth.

## Design

- Mengganti panel admin kaku dengan workspace modern.
- Menambahkan hero dashboard, bento metrics, card portfolio, visual health, floating sidebar, dan responsive kanban.
- Menjaga dark interface, tetapi dengan hierarchy, spacing, gradient, dan feedback yang lebih hidup.
