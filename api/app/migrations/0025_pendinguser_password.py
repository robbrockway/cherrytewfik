# -*- coding: utf-8 -*-
# Generated by Django 1.11.3 on 2017-08-12 21:38
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0024_pendinguser'),
    ]

    operations = [
        migrations.AddField(
            model_name='pendinguser',
            name='password',
            field=models.CharField(blank=True, max_length=128),
        ),
    ]
