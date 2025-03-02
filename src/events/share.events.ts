import { Injectable } from '@nestjs/common';

@Injectable()
export class ShareEvents {
  static uncomment: 'share.uncomment';
  static comment: 'share.comment';
  static create: 'share.create';
  static update: 'share.update';
  static accept: 'share.accept';
  static reject: 'share.reject';
  static remove: 'share.remove';
  static unlike: 'share.unlike';
  static like: 'share.like';
  static move: 'share.move';
}
