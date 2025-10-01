import {MigrationInterface, QueryRunner} from "typeorm";

export class AddWishlistTable1735170000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "wishlist_item" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "addedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "notes" text,
                "customerId" integer,
                "productVariantId" integer,
                CONSTRAINT "PK_wishlist_item" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_wishlist_customer_variant"
            ON "wishlist_item" ("customerId", "productVariantId")
        `);

        await queryRunner.query(`
            ALTER TABLE "wishlist_item"
            ADD CONSTRAINT "FK_wishlist_customer"
            FOREIGN KEY ("customerId")
            REFERENCES "customer"("id")
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "wishlist_item"
            ADD CONSTRAINT "FK_wishlist_variant"
            FOREIGN KEY ("productVariantId")
            REFERENCES "product_variant"("id")
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wishlist_item" DROP CONSTRAINT "FK_wishlist_variant"`);
        await queryRunner.query(`ALTER TABLE "wishlist_item" DROP CONSTRAINT "FK_wishlist_customer"`);
        await queryRunner.query(`DROP INDEX "IDX_wishlist_customer_variant"`);
        await queryRunner.query(`DROP TABLE "wishlist_item"`);
    }
}