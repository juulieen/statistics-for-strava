<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250726130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add rawData column to segment table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE segment ADD raw_data JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE segment DROP raw_data');
    }
}
