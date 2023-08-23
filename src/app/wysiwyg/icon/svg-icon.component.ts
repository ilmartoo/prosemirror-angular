import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Component({
  selector: 'app-svg-icon',
  templateUrl: './svg-icon.component.html',
  styleUrls: ['./svg-icon.component.scss'],
})
export class SvgIconComponent implements OnInit, OnChanges {

  @Input({ required: true }) name!: string;
  @Input() color?: string;
  @ViewChild('wrapper') wrapperRef!: ElementRef<HTMLSpanElement>;

  protected svg?: SafeHtml;

  constructor(private httpClient: HttpClient,
              private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.reloadSVG();
  }

  ngOnChanges(changes: SimpleChanges) {
    const nameChanges = changes['name'];
    if (nameChanges && nameChanges.currentValue !== nameChanges.previousValue) {
      this.reloadSVG();
    }
  }

  private reloadSVG() {
    if (!this.name) {
      this.svg = undefined;
      return;
    }

    this.httpClient
      .get(`assets/${this.name}.svg`, { responseType: 'text' })
      .subscribe(value => this.svg = this.sanitizer.bypassSecurityTrustHtml(value) ?? undefined);
  }

}
