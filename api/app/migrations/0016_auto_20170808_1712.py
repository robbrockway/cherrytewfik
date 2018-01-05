# -*- coding: utf-8 -*-
# Generated by Django 1.11.3 on 2017-08-08 16:12
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0015_exhibition_datetime'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='piece',
            options={'ordering': ['category', 'index_in_cat']},
        ),
        migrations.AlterField(
            model_name='piece',
            name='category',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='pieces', to='app.Category'),
        ),
        migrations.AlterUniqueTogether(
            name='piece',
            unique_together=set([('category', 'index_in_cat')]),
        ),
    ]
