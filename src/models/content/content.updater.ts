import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentUpdateDTO } from './content.dto';
import { DbService } from 'src/db/db.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentRepository } from './content.repository';

@Injectable()
export class ContentUpdater {
  constructor(
    private db: DbService,
    private eventEmitter: EventEmitter2,
  ) {}

  async update(userId: string, content: ContentUpdateDTO) {
    const isExist = await this.db.content.findUnique({
      where: { id: content.id, userId },
    });
    if (!isExist) {
      throw new NotFoundException();
    }
    const updateData = this.getContentUpdateObject(content);

    if (content.tags) {
      await this.handleContentTagsData(content);
    }

    if (content.relatedContents) {
      await this.handleContentRelatedData(content);
    }

    if (content.sourceContents) {
      await this.handleContentSourceData(content);
    }

    if (content.label) {
      await this.handleContentLabel(content);
    }

    const newContent = await this.db.content.update({
      where: {
        userId,
        id: content.id,
      },
      data: {
        ...updateData,
      },
      select: ContentRepository.CONTENT_STORAGE_SELECT,
    });

    this.eventEmitter.emit('content.updated', newContent);

    return newContent;
  }

  getContentUpdateObject(content: ContentUpdateDTO) {
    return {
      name: content.name,
    };
  }

  async handleContentTagsData(content: ContentUpdateDTO) {
    const tagSet = new Set(content.tags.map((t) => t.name));
    await this.db.tag.createMany({
      data: [...tagSet.values()].map((name) => ({ name })),
      skipDuplicates: true,
    });
    await this.db.content_tag.deleteMany({
      where: { contentId: content.id },
    });
    await this.db.content_tag.createMany({
      data: [...tagSet.values()].map((t) => ({
        contentId: content.id,
        name: t,
      })),
    });
  }

  async handleContentRelatedData(content: ContentUpdateDTO) {
    await this.db.related_contents.deleteMany({
      where: { sourceContentId: content.id },
    });
    await this.db.related_contents.createMany({
      skipDuplicates: true,
      data: content.relatedContents.map((c) => ({
        sourceContentId: content.id,
        relatedContentId: c.relatedContent.id,
      })),
    });
  }

  async handleContentSourceData(content: ContentUpdateDTO) {
    await this.db.related_contents.deleteMany({
      where: { relatedContentId: content.id },
    });
    await this.db.related_contents.createMany({
      data: content.sourceContents.map((c) => ({
        sourceContentId: c.sourceContent.id,
        relatedContentId: content.id,
      })),
    });
  }

  async handleContentLabel(content: ContentUpdateDTO) {
    await this.db.content_label.upsert({
      where: { contentId: content.id },
      create: {
        contentId: content.id,
        description: content.label.description,
      },
      update: {
        ...(content.label.description
          ? { description: content.label.description }
          : {}),
      },
    });
  }
}
